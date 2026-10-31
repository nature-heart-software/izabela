// Genuine noninjecting SDK/window check in workspace or packaged Electron.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { createHash } = require('node:crypto')
const { createRequire } = require('node:module')
const appRoot = path.resolve(
  process.env.IZABELA_RC_SMOKE_APP_ROOT || process.argv[2] || 'apps/app',
)
const packaged = appRoot.endsWith('.asar')
const reportPath = path.resolve(
  `coverage/experimental-overlay/${packaged ? 'packaged' : 'workspace'}.json`,
)
const report = {
  status: 'failed',
  stage: 'setup',
  nativeInjectionExecuted: false,
  packaged,
}
fs.mkdirSync(path.dirname(reportPath), { recursive: true })
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

if (!process.versions.electron) {
  const { spawnSync } = require('node:child_process')
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'izabela-rc-smoke-'))
  let status = 1
  try {
    const env = {
      ...process.env,
      IZABELA_RC_SMOKE_APP_ROOT: appRoot,
      IZABELA_RC_SMOKE_PROFILE: profile,
    }
    delete env.ELECTRON_RUN_AS_NODE
    const result = spawnSync(
      require('electron'),
      [
        ...(process.platform === 'linux'
          ? ['--no-sandbox', '--ozone-platform=headless']
          : []),
        __filename,
      ],
      { env, stdio: 'inherit', timeout: 45000, shell: false },
    )
    status = result.status ?? 1
    if (result.error) console.error(result.error.message)
  } finally {
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 })
    } catch (error) {
      console.error(error.message)
      status = 1
    }
    if (status !== 0) {
      const saved = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      saved.status = 'failed'
      saved.error ||= 'Electron child or owned cleanup failed'
      fs.writeFileSync(reportPath, JSON.stringify(saved, null, 2))
    }
  }
  process.exit(status)
}

const { app, BrowserWindow } = require('electron')
const profile = process.env.IZABELA_RC_SMOKE_PROFILE
assert.ok(
  profile && fs.statSync(profile).isDirectory(),
  'parent-owned profile required',
)
app.setPath('userData', profile)
app.setPath('sessionData', path.join(profile, 'session'))
app.disableHardwareAcceleration()
let owner, session, window
let finished = false
const timeout = setTimeout(
  () => finish(new Error('Experimental SDK smoke timed out')),
  30000,
)
function finish(error) {
  if (finished) return
  finished = true
  clearTimeout(timeout)
  for (const cleanup of [
    () => session?.close(),
    () => owner?.dispose(),
    () => {
      if (window && !window.isDestroyed()) window.destroy()
    },
  ]) {
    try {
      cleanup()
    } catch (cleanupError) {
      error ||= cleanupError
    }
  }
  if (error) {
    report.status = 'failed'
    report.error = error.message
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
  app.exit(report.status === 'passed' ? 0 : 1)
}
app
  .whenReady()
  .then(async () => {
    const requireApp = createRequire(path.join(appRoot, 'package.json'))
    const metadataPath = requireApp.resolve(
      'electron-game-overlay/package.json',
    )
    if (packaged)
      assert.ok(
        metadataPath.startsWith(appRoot + path.sep) ||
          metadataPath.startsWith(appRoot + '.unpacked' + path.sep),
        'SDK escaped packaged application',
      )
    const metadata = requireApp('electron-game-overlay/package.json')
    assert.equal(metadata.version, '0.1.0-rc.5')
    const expectedElectron = JSON.parse(
      fs.readFileSync(path.resolve('apps/app/package.json'), 'utf8'),
    ).devDependencies.electron
    assert.equal(process.versions.electron, expectedElectron)
    report.electronVersion = process.versions.electron
    report.sdkVersion = metadata.version
    const sdkRoot = path
      .dirname(metadataPath)
      .replace(/app\.asar([\\/])/, 'app.asar.unpacked$1')
    const distribution = path.join(sdkRoot, 'dist/broker/win32-x64')
    const manifest = JSON.parse(
      fs.readFileSync(path.join(distribution, 'broker-manifest.json'), 'utf8'),
    )
    for (const file of manifest.files) {
      const bytes = fs.readFileSync(path.join(distribution, file.path))
      assert.equal(bytes.length, file.size)
      assert.equal(
        createHash('sha256').update(bytes).digest('hex'),
        file.sha256,
      )
    }
    assert.equal(manifest.files.length, 53)
    report.sealedPayloadsVerified = manifest.files.length
    // Hidden-window smoke must not start/join a broker or execute native helpers.
    const refuse = () => {
      throw new Error(
        'Native process/network activity forbidden in noninjecting smoke',
      )
    }
    Object.assign(require('node:child_process'), {
      spawn: refuse,
      fork: refuse,
      exec: refuse,
      execFile: refuse,
    })
    Object.assign(require('node:net'), {
      connect: refuse,
      createConnection: refuse,
      createServer: refuse,
    })
    report.stage = 'sdk-window'
    const {
      ElectronGameOverlay,
      createReShadeLaunchConfig,
      OverlayTargetWatcher,
    } = requireApp('electron-game-overlay')
    if (process.platform === 'win32')
      assert.ok(
        createReShadeLaunchConfig({
          runsRootDirectory: path.join(profile, 'runs'),
        }),
      )
    assert.equal(typeof OverlayTargetWatcher, 'function')
    report.automaticRuntimeDiscovery = true
    owner = new ElectronGameOverlay()
    session = owner.createSession()
    assert.equal(session.windows.get('absent'), null)
    report.publicSdkOwnerAndLazySession = true
    report.sdkTransportExecuted = false
    const focus = await require('./experimental-overlay-focus-runtime.cjs')({
      sdkRoot,
      profile,
    })
    assert.equal(focus.status, 'passed')
    report.webviewFocusRegression = {
      status: focus.status,
      firstShowAndReopen: true,
      clicks: 0,
      nativeBridgeControlled: true,
    }
    report.realDomTyping = true
    report.status = 'passed'
    report.stage = 'complete'
    finish()
  })
  .catch(finish)
