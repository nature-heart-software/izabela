const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { spawn, execFileSync } = require('node:child_process')
const {
  cases,
  directory: fixtures,
  revision,
  buildInput,
  buildRefusalFixture,
  buildCompositionFixture,
  inputSourceHash,
} = require('./build-fixtures.cjs')
const root = path.resolve(__dirname, '../..')
const argument = (name) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3)
const appRoot = path.resolve(argument('app-root') || 'apps/app')
const appExecutable = argument('app-exe') && path.resolve(argument('app-exe'))
const selected = argument('case') ? [argument('case')] : cases
const verifyCacheStorage = process.argv.includes('--verify-cache-storage')
const targetMode =
  argument('target-mode') || (verifyCacheStorage ? 'fast-folder' : 'folder')
const recovery = process.argv.includes('--recovery')
const elevated = process.argv.includes('--elevated')
const mediumTarget = process.argv.includes('--medium-target')
const startupDelayMs = Number(argument('startup-delay-ms') || 0)
const requestedScale =
  argument('scale') === undefined ? undefined : Number(argument('scale'))
const reportRoot = path.join(
  root,
  'coverage/experimental-overlay/e2e',
  new Date().toISOString().replaceAll(':', '-'),
)
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const runtimeRunsRoot = path.join(
  root,
  'coverage/experimental-overlay',
  verifyCacheStorage ? 'cache-contract-runs' : 'native-runs',
)
function runtimeRunDirectories() {
  if (!fs.existsSync(runtimeRunsRoot)) return []
  return fs
    .readdirSync(runtimeRunsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}
function runtimeStorage() {
  const identities = new Set()
  let files = 0,
    contentBytes = 0n,
    allocatedBytes = 0n,
    privateImages = 0,
    privateCodeFiles = 0,
    privateCodeBytes = 0n,
    stagedControlFiles = 0
  function visit(directory) {
    if (!fs.existsSync(directory)) return
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name)
      assert.equal(
        entry.isSymbolicLink(),
        false,
        'No links to unrelated storage',
      )
      if (entry.isDirectory()) {
        visit(filename)
        continue
      }
      if (!entry.isFile()) continue
      files++
      if (
        /^electron_game_overlay\.addon(?:32|64)$/.test(entry.name) &&
        directory.startsWith(runtimeRunsRoot + path.sep)
      )
        privateImages++
      const stat = fs.statSync(filename, { bigint: true }),
        identity = `${stat.dev}:${stat.ino}`
      if (
        directory.startsWith(runtimeRunsRoot + path.sep) &&
        [
          'ego-process-policy.txt',
          'electron-game-overlay-owned-runtime-v1.marker',
          'electron-overlay-transport-v1.json',
        ].includes(entry.name)
      )
        stagedControlFiles++
      if (
        directory.startsWith(runtimeRunsRoot + path.sep) &&
        /\.(?:exe|dll|addon32|addon64)$/i.test(entry.name) &&
        stat.nlink === 1n
      ) {
        privateCodeFiles++
        privateCodeBytes += stat.size
      }
      if (identities.has(identity)) continue
      identities.add(identity)
      contentBytes += stat.size
      allocatedBytes += stat.blocks * 512n
    }
  }
  visit(runtimeRunsRoot)
  visit(runtimeRunsRoot + '.payloads-v1')
  visit(runtimeRunsRoot + '.payloads-v2')
  return {
    files,
    uniqueFiles: identities.size,
    contentBytes: String(contentBytes),
    allocatedBytes: String(allocatedBytes),
    privateImages,
    privateCodeFiles,
    privateCodeBytes: String(privateCodeBytes),
    stagedControlFiles,
    scope: 'unique file identities, excluding filesystem metadata',
  }
}
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
  delayMs = startupDelayMs,
) {
  const storageBefore = runtimeStorage()
  const directoriesBefore = new Set(runtimeRunDirectories())
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
      (mode === 'fast-folder' ? '-fast-folder' : '') +
      (delayMs ? `-startup-delay-${delayMs}` : '') +
      (scaleFactor === 1 ? '' : `-scale-${scaleFactor}`) +
      (negativeControl ? '-negative-control' : ''),
  )
  const targetDirectory = path.join(directory, 'target')
  const target = path.join(targetDirectory, path.basename(source))
  const profile = path.join(directory, 'profile')
  fs.mkdirSync(targetDirectory, { recursive: true })
  fs.mkdirSync(path.join(profile, 'session'), { recursive: true })
  fs.copyFileSync(source, target)
  let failureTarget, refusedTarget, refusalOwner
  if (recovery && !negativeControl) {
    failureTarget = path.join(targetDirectory, 'owned-overlay-failure.exe')
    fs.copyFileSync(
      path.join(fixtures, 'overlay-test-recovery.exe'),
      failureTarget,
    )
    const refusalDirectory = path.join(directory, 'access-refusal')
    fs.mkdirSync(refusalDirectory, { recursive: true })
    for (const file of manifest.refusalFixture.files) {
      const source = path.join(fixtures, file.path)
      assert.equal(
        createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
        file.sha256,
      )
      fs.copyFileSync(
        source,
        path.join(refusalDirectory, path.basename(source)),
      )
    }
    refusedTarget = path.join(
      refusalDirectory,
      'owned_access_refused_target.exe',
    )
    refusalOwner = path.join(refusalDirectory, 'owned_access_refusal_owner.exe')
  }
  if (mode !== 'fast-folder')
    fs.writeFileSync(
      path.join(
        targetDirectory,
        'electron-game-overlay-startup-barrier.enabled',
      ),
      '',
    )
  fs.writeFileSync(path.join(targetDirectory, 'reshade-input-gate.enabled'), '')
  writeStore(profile, 'game-overlay', {
    enableGameOverlay: false,
    enableExperimentalGameOverlay: true,
    // Folder rules now use the SDK's native policy watcher, without a name rule.
    allowlist: [
      mode === 'early'
        ? target.replaceAll('\\', '/')
        : targetDirectory.replaceAll('\\', '/') + '/**',
      ...(refusedTarget ? [refusedTarget.replaceAll('\\', '/')] : []),
    ],
    denylist: [],
    ignorelist: [],
  })
  writeStore(profile, 'settings', {
    runAsAdmin: elevated,
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
    elevated,
    mediumTarget,
    scaleFactor,
    targetMode: mode,
    appRoot,
    appExecutable,
    directory,
    profile,
    target,
    fixtureSource: source,
    fixtureSha256: fixture.sha256,
    fixtureProvenance: fixture.sourceSnapshotSha256
      ? {
          sourceSnapshotSha256: fixture.sourceSnapshotSha256,
          sources: fixture.sources,
        }
      : { sourceRevision: revision },
    targetArguments: fixture.arguments || [],
    startupDelayMs: delayMs,
    input: path.join(fixtures, 'overlay-test-input.exe'),
    recovery: recovery && !negativeControl,
    failureTarget,
    refusedTarget,
    refusalOwner,
    recoveryOwner: path.join(fixtures, 'overlay-test-recovery.exe'),
    runtimeRunsRoot,
    verifyCacheStorage,
    addonDirectory: path.join(
      root,
      'coverage/experimental-overlay/isolated-addon-registry',
      'long-path-regression-' + 'x'.repeat(128),
    ),
  }
  const configFile = path.join(directory, 'config.json')
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
  if (mediumTarget) {
    const { createRequire } = require('node:module')
    const sdk = createRequire(path.join(root, 'apps/app/package.json'))(
      'electron-game-overlay',
    )
    const context = await sdk.inspectOverlayConsumerExecutionContext()
    assert.equal(
      context.elevated,
      true,
      'Medium-target trial requires an elevated controller',
    )
    const launched = await sdk.launchUnelevatedOverlayConsumer({
      context,
      arguments: [path.join(__dirname, 'medium-target.cjs'), configFile],
    })
    assert.equal(launched.status, 'launched')
    const prefix = path.join(directory, 'medium-target')
    const deadline = Date.now() + 40000
    while (
      !fs.existsSync(prefix + '.ready.json') &&
      !fs.existsSync(prefix + '.error.json') &&
      Date.now() < deadline
    )
      await wait(20)
    if (!fs.existsSync(prefix + '.ready.json')) {
      fs.writeFileSync(prefix + '.stop', '')
      throw new Error('Medium fixture owner did not initialize')
    }
    const owner = JSON.parse(fs.readFileSync(prefix + '.ready.json', 'utf8'))
    assert.equal(owner.ownerPid, launched.replacement.pid)
    assert.equal(
      owner.creationTime100ns,
      launched.replacement.creationTime100ns,
    )
    assert.equal(owner.elevated, false)
    assert.equal(owner.integrityRid, 8192)
    assert.equal(owner.sessionId, context.sessionId)
    config.mediumOwnerContext = owner
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
  }
  await assertFreePort(7070)
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  child = spawn(
    appExecutable || require('electron'),
    appExecutable
      ? [
          '--inspect-brk=127.0.0.1:0',
          `--force-device-scale-factor=${scaleFactor}`,
          `--user-data-dir=${profile}`,
        ]
      : [
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
    if (appExecutable)
      await require('./packaged.cjs').instrumentPackaged(
        owned,
        config,
        configFile,
      )
    code = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('exit', resolve)
    })
  } finally {
    clearTimeout(timer)
    if (mediumTarget) {
      const prefix = path.join(directory, 'medium-target')
      fs.writeFileSync(prefix + '.stop', '')
      const deadline = Date.now() + 10000
      while (!fs.existsSync(prefix + '.exited.json') && Date.now() < deadline)
        await wait(20)
      assert.ok(
        fs.existsSync(prefix + '.exited.json'),
        'Owned medium fixture owner exited',
      )
    }
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
  report.runtimeStorageBeforeApp = storageBefore
  report.runtimeStorageAfterAppExit = runtimeStorage()
  if (verifyCacheStorage && fs.existsSync(runtimeRunsRoot)) {
    report.status = 'failed'
    report.error ||= 'Logging is off but SDK run storage exists after app shutdown'
  }
  if (verifyCacheStorage && report.status === 'passed') {
    const directory = report.sdkVersionCacheDirectory
    report.cacheFiles = fs
      .readdirSync(directory)
      .sort()
      .map((name) => {
        const stat = fs.statSync(path.join(directory, name), { bigint: true })
        assert.ok(stat.isFile(), `Expected an ordinary cache file: ${name}`)
        return {
          name,
          identity: `${stat.dev}:${stat.ino}`,
          bytes: String(stat.size),
          modifiedAt: String(stat.mtimeNs),
        }
      })
  }
  // Comparing names prevents old-folder pruning from hiding newly retained runs.
  report.newRetiredRunDirectories = runtimeRunDirectories().filter(
    (name) =>
      !directoriesBefore.has(name) &&
      fs.existsSync(
        path.join(
          runtimeRunsRoot,
          name,
          '.electron-game-overlay-run-reclaimable.json',
        ),
      ),
  )
  if (report.status === 'passed' && report.newRetiredRunDirectories.length) {
    report.status = 'failed'
    report.error = 'New retired overlay run folders remained after app shutdown'
  }
  if (
    report.status === 'passed' &&
    (report.runtimeStorageAfterAppExit.privateImages >
      storageBefore.privateImages ||
      report.runtimeStorageAfterAppExit.privateCodeFiles >
        storageBefore.privateCodeFiles ||
      BigInt(report.runtimeStorageAfterAppExit.privateCodeBytes) >
        BigInt(storageBefore.privateCodeBytes) ||
      report.runtimeStorageAfterAppExit.stagedControlFiles >
        storageBefore.stagedControlFiles)
  ) {
    report.status = 'failed'
    report.error =
      'Private overlay binaries or staging control files accumulated after owned target exit and app shutdown'
  }
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n')
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
  if (verifyCacheStorage) {
    assert.ok(appExecutable, 'Cache storage check requires a packaged app')
    assert.equal(selected.length, 1, 'Cache storage check uses one target')
    assert.ok(
      ['d3d11-x64', 'd3d9-x86'].includes(selected[0]),
      'Cache storage check uses a pinned graphics fixture',
    )
    assert.ok(['folder', 'fast-folder'].includes(targetMode))
    assert.equal(requestedScale, 1)
    assert.ok(!elevated && !recovery && !startupDelayMs)
    assert.equal(
      fs.existsSync(runtimeRunsRoot),
      false,
      'Run storage must be absent before the cache check',
    )
  }
  if (elevated) {
    assert.equal(
      selected.length,
      1,
      'Administrator trial uses one pinned graphics fixture',
    )
    assert.equal(
      requestedScale,
      1,
      'Administrator trial requires explicit --scale=1',
    )
    assert.ok(
      appExecutable,
      'Administrator trial must launch the actual packaged executable',
    )
  }
  if (mediumTarget) {
    assert.deepEqual(
      selected,
      ['d3d11-x64'],
      'Medium owner uses the pinned D3D11 fixture',
    )
    assert.equal(elevated, true, 'Medium-target trial requires --elevated')
    assert.equal(targetMode, 'folder', 'Medium-target trial uses folder policy')
    assert.equal(recovery, false)
    assert.equal(startupDelayMs, 0)
  }
  if (appExecutable) {
    assert.ok(fs.existsSync(appExecutable), 'Packaged executable must exist')
    assert.equal(
      appRoot.toLowerCase(),
      path
        .join(path.dirname(appExecutable), 'resources/app.asar')
        .toLowerCase(),
      "--app-root must be the selected executable's own resources/app.asar",
    )
  }
  assert.ok(
    ['early', 'folder', 'fast-folder'].includes(targetMode),
    'Supported target modes: early, folder, fast-folder',
  )
  assert.ok(
    requestedScale === undefined || [1, 1.25, 1.5].includes(requestedScale),
    'Supported E2E scales: 1, 1.25, 1.5',
  )
  if (recovery) {
    assert.deepEqual(selected, ['d3d11-x64'], 'Mixed recovery uses D3D11 x64')
    assert.equal(
      targetMode,
      'folder',
      'Mixed recovery uses broad native policy',
    )
    assert.equal(
      requestedScale,
      1,
      'Mixed recovery requires explicit --scale=1',
    )
  }
  assert.ok(
    Number.isInteger(startupDelayMs) &&
      (startupDelayMs === 0 ||
        (startupDelayMs >= 300 && startupDelayMs <= 5000)),
    'Startup delay must be 0 or 300..5000ms',
  )
  if (startupDelayMs) {
    assert.deepEqual(
      selected,
      ['d3d11-x64'],
      'Delayed startup uses the pinned D3D11 x64 fixture',
    )
    assert.equal(
      requestedScale,
      1,
      'Delayed startup requires explicit --scale=1',
    )
  }
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
  if (selected.includes('d3d11-composition-x64'))
    buildCompositionFixture(manifest)
  if (manifest.inputSourceSha256 !== inputSourceHash()) buildInput(manifest)
  if (recovery) buildRefusalFixture(manifest)
  assert.equal(
    createHash('sha256')
      .update(fs.readFileSync(path.join(fixtures, 'overlay-test-input.exe')))
      .digest('hex'),
    manifest.inputHelperSha256,
    'Native input driver checksum',
  )
  assert.equal(
    createHash('sha256')
      .update(fs.readFileSync(path.join(fixtures, 'overlay-test-recovery.exe')))
      .digest('hex'),
    manifest.recoveryHelperSha256,
    'Owned recovery and delayed-start fixture checksum',
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
  if (!argument('target-mode') && !verifyCacheStorage) {
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
  if (!argument('case') && !startupDelayMs) {
    reports.push(await runCase('d3d11-x64', false, manifest, 1, 'folder', 800))
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
  if (
    verifyCacheStorage &&
    reports.every((report) => report.status === 'passed')
  ) {
    assert.deepEqual(
      reports[1].cacheFiles,
      reports[0].cacheFiles,
      'A restarted Izabela instance must reuse the same unmodified cache files',
    )
  }
  const passed = reports.every(
    (report) => report.status === 'passed' && report.exitCode === 0,
  )
  fs.writeFileSync(
    path.join(reportRoot, 'summary.json'),
    JSON.stringify(
      {
        status: passed ? 'passed' : 'failed',
        fixtureSource: revision,
        runtimeStorage: runtimeStorage(),
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
