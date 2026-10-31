const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash, randomUUID } = require('node:crypto')
const { spawn, execFileSync } = require('node:child_process')
const {
  cases,
  directory: fixtures,
  revision,
  buildInput,
  inputSourceHash,
} = require('./build-fixtures.cjs')
const root = path.resolve(__dirname, '../..')
const argument = (name) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3)
const appRoot = path.resolve(argument('app-root') || 'apps/app')
const selected = argument('case') ? [argument('case')] : cases
const targetMode = argument('target-mode') || 'best-effort'
const requestedScale =
  argument('scale') === undefined ? undefined : Number(argument('scale'))
const reportRoot = path.join(
  root,
  'coverage/experimental-overlay/e2e',
  new Date().toISOString().replaceAll(':', '-'),
)
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let child
function pnpm(args) {
  const options = {
    cwd: root,
    windowsHide: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DISABLE_AUTO_UPDATE: 'true',
      NX_DAEMON: 'false',
      npm_config_manage_package_manager_versions: 'false',
    },
  }
  if (process.env.npm_execpath)
    execFileSync(process.execPath, [process.env.npm_execpath, ...args], options)
  else execFileSync('pnpm.cmd', args, { ...options, shell: true })
}
async function assertFreePort(port) {
  await new Promise((resolve, reject) => {
    const server = require('node:net').createServer()
    server.once('error', () =>
      reject(
        new Error(
          `Port ${port} is occupied. Close the running dev app before desktop E2E; this test never stops unrelated apps.`,
        ),
      ),
    )
    server.listen(port, '127.0.0.1', () => server.close(resolve))
  })
}
function writeStore(profile, name, value) {
  const directory = path.join(profile, 'electron-pinia')
  fs.mkdirSync(directory, { recursive: true })
  const id = 'electron-pinia-' + name
  fs.writeFileSync(
    path.join(directory, id + '.json'),
    JSON.stringify({ [id]: value }),
  )
}
async function runCase(
  name,
  negativeControl,
  manifest,
  scaleFactor = 1,
  mode = targetMode,
) {
  const fixture = manifest.files.find((file) => file.case === name)
  assert.ok(fixture, `Missing compiled fixture: ${name}`)
  const source = path.join(fixtures, fixture.path)
  assert.equal(
    createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
    fixture.sha256,
    'Pinned host checksum',
  )
  const directory = path.join(
    reportRoot,
    name +
      (mode === 'early' ? '-early' : '') +
      (scaleFactor === 1 ? '' : `-scale-${scaleFactor}`) +
      (negativeControl ? '-negative-control' : ''),
  )
  const targetDirectory = path.join(directory, 'target')
  const target = path.join(targetDirectory, path.basename(source))
  const profile = path.join(directory, 'profile')
  fs.mkdirSync(targetDirectory, { recursive: true })
  fs.mkdirSync(path.join(profile, 'session'), { recursive: true })
  fs.copyFileSync(source, target)
  for (const marker of [
    'electron-game-overlay-startup-barrier.enabled',
    'reshade-input-gate.enabled',
  ])
    fs.writeFileSync(path.join(targetDirectory, marker), '')
  writeStore(profile, 'game-overlay', {
    enableGameOverlay: false,
    enableExperimentalGameOverlay: true,
    // Folder rule deliberately exercises public process observation + exact PID,
    // without acquiring the SDK's exclusive future-target watcher.
    allowlist: [
      mode === 'early'
        ? target.replaceAll('\\', '/')
        : targetDirectory.replaceAll('\\', '/') + '/**',
    ],
    denylist: [],
    ignorelist: [],
  })
  writeStore(profile, 'settings', {
    runAsAdmin: false,
    launchOnStartup: false,
    enableAutoUpdate: false,
    enableSTTTS: false,
    enableTranslation: false,
    selectedSpeechEngine: 'samtts',
    theme: 'light',
    clearMessageOnWindowHide: false,
    enableOverlayWindow: false,
    audioOutputs: [],
  })
  const config = {
    case: name,
    negativeControl,
    scaleFactor,
    targetMode: mode,
    appRoot,
    directory,
    profile,
    target,
    input: path.join(fixtures, 'overlay-test-input.exe'),
  }
  const configFile = path.join(directory, 'config.json')
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
  await assertFreePort(7070)
  const env = {
    ...process.env,
    ELECTRON_GAME_OVERLAY_BROKER_PIPE: String.raw`\\.\pipe\izabela-overlay-e2e-${randomUUID()}`,
  }
  delete env.ELECTRON_RUN_AS_NODE
  child = spawn(
    require('electron'),
    [
      `--force-device-scale-factor=${scaleFactor}`,
      path.join(__dirname, 'runtime.cjs'),
      configFile,
    ],
    {
      cwd: path.join(root, 'apps/app'),
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  const stdout = fs.createWriteStream(path.join(directory, 'app.stdout.log'))
  const stderr = fs.createWriteStream(path.join(directory, 'app.stderr.log'))
  const owned = child
  owned.stdout.pipe(stdout)
  owned.stderr.pipe(stderr)
  const timer = setTimeout(() => child?.kill(), 165000)
  let code
  try {
    code = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('exit', resolve)
    })
  } finally {
    clearTimeout(timer)
    owned.stdout.unpipe(stdout)
    owned.stderr.unpipe(stderr)
    owned.stdout.destroy()
    owned.stderr.destroy()
    stdout.end()
    stderr.end()
  }
  child = undefined
  const file = path.join(directory, 'report.json')
  const report = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : { status: 'failed', error: 'Electron exited without a native E2E report' }
  report.exitCode = code
  console.log(
    `${report.status === 'passed' && code === 0 ? 'PASS' : 'FAIL'} ${name}${
      negativeControl ? ' negative-control' : ''
    } scale=${scaleFactor} ${mode}${report.error ? ': ' + report.error : ''}`,
  )
  return report
}
async function main() {
  assert.equal(
    process.platform,
    'win32',
    'Native overlay E2E requires an unlocked interactive Windows desktop',
  )
  for (const name of selected)
    assert.ok(cases.includes(name), `Unknown fixture: ${name}`)
  assert.ok(
    ['early', 'best-effort'].includes(targetMode),
    'Supported target modes: early, best-effort',
  )
  assert.ok(
    requestedScale === undefined || [1, 1.25, 1.5].includes(requestedScale),
    'Supported E2E scales: 1, 1.25, 1.5',
  )
  await assertFreePort(7070)
  if (!fs.existsSync(path.join(fixtures, 'manifest.json')))
    require('./build-fixtures.cjs').build()
  if (process.argv.includes('--build')) {
    assert.ok(
      !appRoot.endsWith('.asar'),
      'Packaged tests use an already-built app',
    )
    pnpm(['build:deps'])
    pnpm(['--filter', 'izabela-next', 'exec', 'vite', 'build'])
    pnpm(['--filter', 'izabela-next', 'run', 'rebuild'])
  }
  assert.ok(
    fs.existsSync(
      appRoot.endsWith('.asar')
        ? appRoot
        : path.join(appRoot, 'dist-electron/background.js'),
    ),
    'Build the real app first with --build',
  )
  const manifest = JSON.parse(
    fs.readFileSync(path.join(fixtures, 'manifest.json'), 'utf8'),
  )
  assert.equal(manifest.sourceRevision, revision)
  if (manifest.inputSourceSha256 !== inputSourceHash()) buildInput(manifest)
  assert.equal(
    createHash('sha256')
      .update(fs.readFileSync(path.join(fixtures, 'overlay-test-input.exe')))
      .digest('hex'),
    manifest.inputHelperSha256,
    'Native input driver checksum',
  )
  fs.mkdirSync(reportRoot, { recursive: true })
  const reports = []
  for (const name of selected)
    reports.push(await runCase(name, false, manifest, requestedScale ?? 1))
  if (requestedScale === undefined) {
    const scaleCase = selected.includes('d3d11-x64') ? 'd3d11-x64' : selected[0]
    for (const scale of [1.25, 1.5])
      reports.push(await runCase(scaleCase, false, manifest, scale))
  }
  if (!argument('target-mode')) {
    reports.push(
      await runCase(
        selected.includes('d3d11-x64') ? 'd3d11-x64' : selected[0],
        false,
        manifest,
        requestedScale ?? 1,
        'early',
      ),
    )
  }
  // A regression test must detect the original bug, not merely prove that its
  // own input helper can type into an Electron webview.
  if (reports.every((report) => report.status === 'passed'))
    reports.push(
      await runCase(
        selected.includes('d3d11-x64') ? 'd3d11-x64' : selected[0],
        true,
        manifest,
        requestedScale ?? 1,
      ),
    )
  const passed = reports.every(
    (report) => report.status === 'passed' && report.exitCode === 0,
  )
  fs.writeFileSync(
    path.join(reportRoot, 'summary.json'),
    JSON.stringify(
      {
        status: passed ? 'passed' : 'failed',
        fixtureSource: revision,
        reports,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`Native graphics E2E evidence: ${reportRoot}`)
  assert.ok(
    passed,
    'Native open-and-type regression failed; inspect reports and target screenshots',
  )
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    child?.kill()
    process.exit(1)
  })
main().catch((error) => {
  console.error(error.stack)
  child?.kill()
  process.exitCode = 1
})
