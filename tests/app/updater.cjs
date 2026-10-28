// Never install updates on a developer's machine. This probe runs only on a
// disposable hosted VM, against a loopback feed serving this job's installers.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const { createHash } = require('node:crypto')
const { spawn, execFileSync } = require('node:child_process')
const { once } = require('node:events')
const { seedProfile } = require('./profile-upgrades.cjs')
const { connect } = require('./cdp.cjs')
const pkg = require('../../apps/app/package.json')
const root = path.resolve(__dirname, '../..')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const results = []
async function until(fn, label, timeout = 90000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await fn()) return
    await sleep(250)
  }
  throw Error('Timed out: ' + label)
}
async function command(file, args) {
  const child = spawn(file, args, { windowsHide: true, stdio: 'inherit' })
  const timer = setTimeout(() => stop(child), 180000)
  try {
    assert.equal((await once(child, 'exit'))[0], 0)
  } finally {
    clearTimeout(timer)
  }
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
async function check(name, fn) {
  const start = Date.now()
  await fn()
  results.push({ name, pass: true, duration: Date.now() - start })
  console.log('UPDATER_PASS ' + name)
}
function installer(directory) {
  const files = fs
    .readdirSync(directory)
    .filter((file) => /setup.*\.exe$/i.test(file))
  assert.equal(
    files.length,
    1,
    'Expected exactly one installer in ' + directory,
  )
  return path.join(directory, files[0])
}
async function run() {
  assert.equal(process.platform, 'win32')
  assert.equal(
    process.env.GITHUB_ACTIONS,
    'true',
    'Updater tests run only in GitHub Actions',
  )
  assert.equal(
    process.env.RUNNER_ENVIRONMENT,
    'github-hosted',
    'Updater tests require a disposable hosted VM',
  )
  const work = fs.mkdtempSync(
    path.join(process.env.RUNNER_TEMP, 'izabela-updater-'),
  )
  const installDirectory = path.join(work, 'installed')
  const executable = path.join(installDirectory, pkg.productName + '.exe')
  const profile = path.join(process.env.APPDATA, pkg.productName)
  assert.ok(
    !fs.existsSync(profile),
    'Refusing to overwrite an existing profile',
  )
  fs.cpSync(seedProfile(work, 'split'), profile, {
    recursive: true,
    errorOnExist: true,
    force: false,
  })
  const baseline = installer(path.join(root, 'coverage/installer-input'))
  const candidate = installer(path.join(root, 'coverage/updater-input'))
  const bytes = fs.readFileSync(candidate)
  const sha512 = createHash('sha512').update(bytes).digest('base64')
  const report = path.join(root, 'coverage/updater-results')
  fs.mkdirSync(report, { recursive: true })
  let mode = 'interrupt',
    child,
    debuggerClient
  const requests = []
  const server = http.createServer((req, res) => {
    requests.push({ mode, url: req.url })
    if (req.url.startsWith('/latest.yml')) {
      const digest =
        mode === 'checksum'
          ? (sha512[0] === 'A' ? 'B' : 'A') + sha512.slice(1)
          : sha512
      res.setHeader('content-type', 'text/yaml')
      res.end(
        `version: 6.6.7\nfiles:\n  - url: update.exe\n    sha512: ${digest}\n    size: ${bytes.length}\npath: update.exe\nsha512: ${digest}\nreleaseDate: '2026-10-28T00:00:00.000Z'\n`,
      )
    } else if (
      req.url.startsWith('/update.exe') &&
      !req.url.includes('.blockmap')
    ) {
      res.writeHead(200, {
        'content-type': 'application/octet-stream',
        'content-length': bytes.length,
      })
      if (mode === 'interrupt') {
        res.write(bytes.subarray(0, 65536))
        setTimeout(() => res.destroy(), 100)
      } else res.end(bytes)
    } else {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const feed = 'http://127.0.0.1:' + server.address().port
  const launch = async (label) => {
    child = spawn(executable, ['--inspect=9223'], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const log = fs.createWriteStream(path.join(report, label + '.log'))
    child.stdout.pipe(log, { end: false })
    child.stderr.pipe(log, { end: false })
    child.once('close', () => log.end())
    debuggerClient = await connect('http://127.0.0.1:9223/json/list')
    return debuggerClient
  }
  try {
    await command(baseline, ['/S', '/currentuser', '/D=' + installDirectory])
    await launch('baseline')
    const setup = `globalThis.__updaterTest = { updater: process.mainModule.require('module').createRequire(process.mainModule.require('electron').app.getAppPath() + '/package.json')('electron-updater').autoUpdater, events: [] };
      __updaterTest.updater.autoDownload = false;
      __updaterTest.updater.autoInstallOnAppQuit = false;
      __updaterTest.updater.setFeedURL({ provider: 'generic', url: ${JSON.stringify(
        feed,
      )} });
      __updaterTest.updater.channel = 'latest';
      __updaterTest.updater.on('error', error => __updaterTest.events.push({ type: 'error', message: error.message }));
      __updaterTest.updater.on('update-downloaded', info => __updaterTest.events.push({ type: 'downloaded', version: info.version })); true`
    assert.equal(await debuggerClient.evaluate(setup), true)
    for (const fault of ['interrupt', 'checksum'])
      await check(
        fault + ' fails verification without applying the update',
        async () => {
          mode = fault
          const outcome = await debuggerClient.evaluate(
            `(async () => {
        const result = await __updaterTest.updater.checkForUpdates();
        try { await __updaterTest.updater.downloadUpdate(result.cancellationToken); return { accepted: true } }
        catch (error) { return { accepted: false, message: error.message } }
      })()`,
            120000,
          )
          assert.equal(outcome.accepted, false, JSON.stringify(outcome))
          if (fault === 'checksum')
            assert.match(outcome.message, /sha512|checksum/i)
          assert.equal(
            await debuggerClient.evaluate(
              `__updaterTest.events.filter(e => e.type === 'downloaded').length`,
            ),
            0,
          )
          assert.equal(
            await debuggerClient.evaluate(
              `process.mainModule.require('electron').app.getVersion()`,
            ),
            '6.6.6',
          )
        },
      )
    await check(
      'valid update downloads, verifies, applies and relaunches with preserved data',
      async () => {
        mode = 'success'
        const downloaded = await debuggerClient.evaluate(
          `(async () => {
        const result = await __updaterTest.updater.checkForUpdates();
        await __updaterTest.updater.downloadUpdate(result.cancellationToken);
        return __updaterTest.events.filter(e => e.type === 'downloaded');
      })()`,
          120000,
        )
        assert.deepEqual(
          downloaded.map((item) => item.version),
          ['6.6.7'],
        )
        await debuggerClient.evaluate(
          `setTimeout(() => __updaterTest.updater.quitAndInstall(true, true), 250); true`,
        )
        debuggerClient.close()
        debuggerClient = null
        await until(() => child.exitCode !== null, 'old application exits')
        await until(() => {
          try {
            const version = execFileSync(
              'powershell',
              [
                '-NoProfile',
                '-Command',
                '(Get-Item -LiteralPath $env:IZABELA_UPDATE_EXE).VersionInfo.ProductVersion',
              ],
              {
                env: { ...process.env, IZABELA_UPDATE_EXE: executable },
                windowsHide: true,
                encoding: 'utf8',
              },
            ).trim()
            return version === '6.6.7'
          } catch {
            return false
          }
        }, 'updated executable version')
        // Socket.IO in the automatically relaunched application proves startup.
        const { io } = require('socket.io-client')
        const socket = io('http://127.0.0.1:7071', {
          transports: ['websocket'],
        })
        try {
          await until(
            () => socket.connected,
            'automatically relaunched application',
          )
          const ended = once(socket, 'message:end')
          socket.emit('say', 'Automatic update completed.')
          await Promise.race([
            ended,
            sleep(30000).then(() => {
              throw Error('Updated speech did not finish')
            }),
          ])
        } finally {
          socket.disconnect()
        }
        const settings = JSON.parse(
          fs.readFileSync(
            path.join(profile, 'electron-pinia/electron-pinia-settings.json'),
          ),
        )
        assert.equal(settings['electron-pinia-settings'].theme, 'dark')
        const dictionary = JSON.parse(
          fs.readFileSync(
            path.join(profile, 'electron-pinia/electron-pinia-dictionary.json'),
          ),
        )
        assert.deepEqual(dictionary['electron-pinia-dictionary'].definitions, [
          ['old', 'preserved replacement'],
        ])
      },
    )
  } finally {
    debuggerClient?.close()
    stop(child)
    // Only executables installed inside this script's freshly created directory.
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        'Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $env:IZABELA_UPDATE_EXE } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }',
      ],
      {
        env: { ...process.env, IZABELA_UPDATE_EXE: executable },
        windowsHide: true,
      },
    )
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    fs.writeFileSync(
      path.join(report, 'summary.json'),
      JSON.stringify({ results, requests, installDirectory }, null, 2),
    )
  }
}
if (require.main === module)
  run().catch((error) => {
    console.error(error.stack || error)
    process.exitCode = 1
  })
module.exports = { run }
