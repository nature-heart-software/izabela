// Installs/uninstalls software: deliberately restricted to disposable GitHub-hosted Windows jobs.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawn, execFileSync } = require('node:child_process')
const { once } = require('node:events')
const { seedProfile } = require('./profile-upgrades.cjs')
const pkg = require('../../apps/app/package.json')
const root = path.resolve(__dirname, '../..')
const results = []
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function until(fn, label, timeout = 45000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await fn()
    if (value) return value
    await sleep(150)
  }
  throw Error('Timed out: ' + label)
}
async function command(file, args) {
  const child = spawn(file, args, { windowsHide: true, stdio: 'inherit' })
  const timer = setTimeout(() => {
    try {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      })
    } catch {}
  }, 180000)
  try {
    const [code] = await once(child, 'exit')
    assert.equal(code, 0, path.basename(file) + ' exit code')
  } finally {
    clearTimeout(timer)
  }
}
async function check(name, fn) {
  const start = Date.now()
  await fn()
  results.push({ name, pass: true, duration: Date.now() - start })
  console.log('INSTALLER_PASS ' + name)
}
function stop(child) {
  if (!child || child.exitCode !== null) return
  try {
    execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    })
  } catch {}
}
async function inspectInstalled(executable, expected, logPath) {
  const child = spawn(executable, ['--remote-debugging-port=9222'], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const log = fs.createWriteStream(logPath)
  child.stdout.pipe(log, { end: false })
  child.stderr.pipe(log, { end: false })
  let socket
  try {
    const target = await until(async () => {
      try {
        const response = await fetch('http://127.0.0.1:9222/json/list')
        const pages = await response.json()
        return pages.find(
          (page) =>
            page.url.includes('messenger') &&
            !page.url.includes('game-overlay'),
        )
      } catch {
        return null
      }
    }, 'installed messenger debugger')
    const WebSocket = require('ws')
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await once(socket, 'open')
    let id = 0
    const pending = new Map()
    socket.on('message', (data) => {
      const message = JSON.parse(data.toString())
      if (message.id) {
        pending.get(message.id)?.(message)
        pending.delete(message.id)
      }
    })
    const evaluate = async (expression) => {
      const request = ++id
      const response = new Promise((resolve) => pending.set(request, resolve))
      socket.send(
        JSON.stringify({
          id: request,
          method: 'Runtime.evaluate',
          params: { expression, returnByValue: true, awaitPromise: true },
        }),
      )
      const message = await Promise.race([
        response,
        sleep(8000).then(() => {
          throw Error('Installed renderer evaluation timeout')
        }),
      ])
      assert.ok(
        !message.error && !message.result?.exceptionDetails,
        'Installed renderer evaluation failed',
      )
      return message.result.result.value
    }
    await until(
      () =>
        evaluate(
          "Boolean(document.querySelector('#app')?.__vue_app__?.config.globalProperties.$pinia?._s.get('settings'))",
        ),
      'installed Vue store',
    )
    const state = await evaluate(
      "JSON.stringify(Object.fromEntries(['settings','dictionary','messages','profiles'].map(id => [id,document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get(id).$state])))",
    )
    const stores = JSON.parse(state)
    assert.equal(stores.settings.theme, 'dark')
    assert.equal(stores.settings.enableSTTTS, false)
    assert.deepEqual(stores.dictionary.definitions, [
      ['old', 'preserved replacement'],
    ])
    assert.equal(stores.profiles.profiles[0].name, 'Preserved profile')
    assert.equal(stores.messages.shortcutMessages[0].id, 'old-phrase')
    assert.equal(stores.messages.history[0].id, 'old-history')
    if (expected === 'upgraded')
      assert.equal(
        stores.settings.universalApiEndpoint,
        'https://custom.example.invalid/v2/',
      )
    const { io } = require('socket.io-client')
    const speech = io('http://127.0.0.1:7071', {
      transports: ['websocket'],
      reconnection: false,
    })
    try {
      await until(() => speech.connected, 'installed application event socket')
      const playback = new Promise((resolve, reject) => {
        speech.on('message:error', () =>
          reject(Error('Installed speech playback failed')),
        )
        speech.on('message:end', resolve)
      })
      speech.emit('say', 'Installed application smoke test.')
      await Promise.race([
        playback,
        sleep(20000).then(() => {
          throw Error('Installed speech did not finish')
        }),
      ])
    } finally {
      speech.disconnect()
    }
    // Mutate through the running old/current application, rather than only seeding files.
    await evaluate(
      "document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('settings').$patch({ hideWindowOnMessage: false, enableAutoUpdate: false, launchOnStartup: false }); true",
    )
    await sleep(1000)
  } finally {
    socket?.close()
    stop(child)
    log.end()
  }
}
async function run() {
  assert.equal(process.platform, 'win32', 'Installer tests require Windows')
  assert.equal(
    process.env.GITHUB_ACTIONS,
    'true',
    'Installer tests run only in GitHub Actions',
  )
  assert.equal(
    process.env.RUNNER_ENVIRONMENT,
    'github-hosted',
    'Installer tests require a disposable GitHub-hosted VM',
  )
  assert.ok(
    process.env.RUNNER_TEMP && process.env.APPDATA,
    'Runner paths missing',
  )
  const work = fs.mkdtempSync(
    path.join(path.resolve(process.env.RUNNER_TEMP), 'izabela-installer-'),
  )
  const installDirectory = path.join(work, 'installed')
  const executable = path.join(installDirectory, pkg.productName + '.exe')
  const profile = path.join(process.env.APPDATA, pkg.productName)
  const report = path.join(root, 'coverage/installer-results')
  fs.mkdirSync(report, { recursive: true })
  assert.ok(
    !fs.existsSync(profile),
    'Refusing to overwrite an existing application profile',
  )
  const candidates = fs
    .readdirSync(path.join(root, 'coverage/installer-input'))
    .filter((name) => /setup.*\.exe$/i.test(name))
  assert.equal(candidates.length, 1, 'Expected exactly one candidate installer')
  const candidate = path.join(root, 'coverage/installer-input', candidates[0])
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Izabela-installer-regressions',
    ...(process.env.GH_TOKEN
      ? { Authorization: 'Bearer ' + process.env.GH_TOKEN }
      : {}),
  }
  const releaseResponse = await fetch(
    'https://api.github.com/repos/nature-heart-software/izabela/releases/latest',
    { headers },
  )
  assert.equal(
    releaseResponse.status,
    200,
    'Unable to select a released baseline',
  )
  const release = await releaseResponse.json()
  const asset = release.assets.find((item) =>
    /^izabela-next-setup-.*-win\.exe$/i.test(item.name),
  )
  assert.ok(asset, 'Released Windows installer not found')
  const baseline = path.join(work, 'released-baseline.exe')
  const download = await fetch(asset.browser_download_url)
  assert.equal(download.status, 200, 'Unable to download released installer')
  fs.writeFileSync(baseline, Buffer.from(await download.arrayBuffer()))
  const seeded = seedProfile(work, 'split')
  fs.cpSync(seeded, profile, {
    recursive: true,
    errorOnExist: true,
    force: false,
  })
  const marker = path.join(profile, 'installer-preservation-marker.txt')
  fs.writeFileSync(marker, 'Izabela installer preservation fixture')
  try {
    await check(
      'install released baseline and launch actual executable',
      async () => {
        await command(baseline, [
          '/S',
          '/currentuser',
          '/D=' + installDirectory,
        ])
        assert.ok(
          fs.existsSync(executable),
          'Released executable missing from requested install directory',
        )
        await inspectInstalled(
          executable,
          'baseline',
          path.join(report, 'baseline.log'),
        )
      },
    )
    await check(
      'upgrade installed release and preserve user profile',
      async () => {
        await command(candidate, [
          '/S',
          '/currentuser',
          '/D=' + installDirectory,
        ])
        assert.ok(
          fs.existsSync(path.join(installDirectory, 'resources/app.asar')),
        )
        await inspectInstalled(
          executable,
          'upgraded',
          path.join(report, 'upgraded.log'),
        )
        assert.equal(
          fs.readFileSync(marker, 'utf8'),
          'Izabela installer preservation fixture',
        )
      },
    )
    await check(
      'uninstall removes application and preserves user profile',
      async () => {
        const uninstall = fs
          .readdirSync(installDirectory)
          .find((name) => /^uninstall.*\.exe$/i.test(name))
        assert.ok(uninstall, 'Uninstaller missing')
        await command(path.join(installDirectory, uninstall), ['/S'])
        await until(
          () => !fs.existsSync(executable),
          'installed executable removed',
        )
        await until(
          () =>
            !fs.existsSync(path.join(installDirectory, 'resources/app.asar')),
          'installed ASAR removed',
        )
        assert.equal(
          fs.readFileSync(marker, 'utf8'),
          'Izabela installer preservation fixture',
        )
        assert.ok(
          fs.existsSync(
            path.join(profile, 'electron-pinia/electron-pinia-settings.json'),
          ),
        )
      },
    )
  } finally {
    fs.writeFileSync(
      path.join(report, 'summary.json'),
      JSON.stringify(
        {
          baseline: release.tag_name,
          candidate: candidates[0],
          installDirectory,
          results,
        },
        null,
        2,
      ),
    )
  }
}
if (require.main === module)
  run().catch((error) => {
    console.error(error.stack || error)
    process.exitCode = 1
  })
module.exports = { run }
