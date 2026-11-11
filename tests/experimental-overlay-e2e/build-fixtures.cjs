const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const { createRequire } = require('node:module')

const revision = '1ff4baeb5930bb20d6dff0d8e69ca05c8eb8be98'
const root = path.resolve(__dirname, '../..')
const directory = path.join(root, 'coverage/experimental-overlay/fixtures')
const source = path.join(directory, 'source')
const cases = [
  'd3d9-x64',
  'd3d10-x64',
  'd3d11-x64',
  'd3d12-x64',
  'd3d9-x86',
  'd3d10-x86',
  'd3d11-composition-x64',
]
function execute(command, args, cwd = root) {
  execFileSync(command, args, { cwd, windowsHide: true, stdio: 'inherit' })
}
function build() {
  assert.equal(
    process.platform,
    'win32',
    'Graphics fixtures require Windows and VS 2022 C++ tools',
  )
  fs.mkdirSync(directory, { recursive: true })
  if (!fs.existsSync(path.join(source, '.git'))) {
    execute('git', ['init', source])
    execute('git', [
      '-C',
      source,
      'fetch',
      '--depth=1',
      'https://github.com/Wurielle/electron-game-overlay.git',
      revision,
    ])
    execute('git', ['-C', source, 'checkout', '--detach', 'FETCH_HEAD'])
  }
  assert.equal(
    execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      windowsHide: true,
    }).trim(),
    revision,
  )
  assert.equal(
    execFileSync('git', ['-C', source, 'status', '--porcelain'], {
      encoding: 'utf8',
      windowsHide: true,
    }).trim(),
    '',
    'Fixture checkout must be unmodified',
  )
  const native = path.join(source, 'libs/electron-game-overlay-runtime')
  const manifest = { schema: 1, sourceRevision: revision, files: [] }
  for (const arch of ['x64', 'x86']) {
    execute('cmake', ['--preset', `vs2022-${arch}`], native)
    const buildDirectory = path.join(
      source,
      `build/electron-game-overlay-runtime${arch === 'x86' ? '-x86' : ''}`,
    )
    const targets = cases
      .filter((c) => c.endsWith(arch) && !c.includes('-composition-'))
      .map((c) => `${c.split('-')[0]}_overlay_test_host`)
    execute(
      'cmake',
      [
        '--build',
        buildDirectory,
        '--config',
        'RelWithDebInfo',
        '--parallel',
        '2',
        '--target',
        ...targets,
      ],
      native,
    )
    for (const target of targets) {
      const name = `${target.split('_')[0]}-${arch}`
      const destination = path.join(directory, 'bin', name, `${target}.exe`)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      // Never copy the SDK's native_input_gate_addon: Izabela owns the overlay.
      fs.copyFileSync(
        path.join(buildDirectory, 'RelWithDebInfo', `${target}.exe`),
        destination,
      )
      const bytes = fs.readFileSync(destination)
      const machine = bytes.readUInt16LE(bytes.readUInt32LE(0x3c) + 4)
      assert.equal(machine, arch === 'x64' ? 0x8664 : 0x14c, name)
      manifest.files.push({
        case: name,
        path: path.relative(directory, destination).replaceAll('\\', '/'),
        sha256: createHash('sha256').update(bytes).digest('hex'),
      })
    }
  }
  fs.copyFileSync(
    path.join(source, 'LICENSE'),
    path.join(directory, 'SDK-fixtures-LICENSE'),
  )
  buildInput(manifest)
  buildCompositionFixture(manifest)
  console.log(`Built controlled graphics fixtures: ${directory}`)
  return directory
}
function inputSourceHash() {
  return createHash('sha256')
    .update(fs.readFileSync(path.join(__dirname, 'native/input.cpp')))
    .update(fs.readFileSync(path.join(__dirname, 'native/recovery.cpp')))
    .update(fs.readFileSync(path.join(__dirname, 'native/CMakeLists.txt')))
    .digest('hex')
}
function buildInput(manifest) {
  const helperBuild = path.join(directory, 'input-build')
  execute('cmake', [
    '-S',
    path.join(__dirname, 'native'),
    '-B',
    helperBuild,
    '-G',
    'Visual Studio 17 2022',
    '-A',
    'x64',
  ])
  execute('cmake', [
    '--build',
    helperBuild,
    '--config',
    'Release',
    '--parallel',
    '2',
  ])
  fs.copyFileSync(
    path.join(helperBuild, 'Release/overlay-test-input.exe'),
    path.join(directory, 'overlay-test-input.exe'),
  )
  manifest.inputHelperSha256 = createHash('sha256')
    .update(fs.readFileSync(path.join(directory, 'overlay-test-input.exe')))
    .digest('hex')
  fs.copyFileSync(
    path.join(helperBuild, 'Release/overlay-test-recovery.exe'),
    path.join(directory, 'overlay-test-recovery.exe'),
  )
  manifest.recoveryHelperSha256 = createHash('sha256')
    .update(fs.readFileSync(path.join(directory, 'overlay-test-recovery.exe')))
    .digest('hex')
  manifest.inputSourceSha256 = inputSourceHash()
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )
}
function buildCompositionFixture(manifest) {
  // The CI fixture job intentionally compiles before installing app dependencies.
  const dependency = JSON.parse(
    fs.readFileSync(path.join(root, 'apps/app/package.json'), 'utf8'),
  ).dependencies['electron-game-overlay']
  assert.ok(dependency.startsWith('file:') && dependency.endsWith('.tgz'))
  const prefix = path.resolve(
    root,
    'apps/app',
    dependency.slice(5).replace(/\.tgz$/, ''),
  )
  const archive = prefix + '.source.zip'
  const provenance = JSON.parse(
    execFileSync(
      'tar',
      ['-xOf', prefix + '.tgz', 'package/SDK_PROVENANCE.json'],
      {
        encoding: 'utf8',
        windowsHide: true,
      },
    ),
  )
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
  const sourceSnapshotSha256 = hash(fs.readFileSync(archive))
  assert.equal(
    sourceSnapshotSha256,
    provenance.sourceSnapshot.sha256,
    'Composition fixture source snapshot provenance',
  )
  const manifestBytes = fs.readFileSync(prefix + '.source-manifest.json')
  assert.equal(
    hash(manifestBytes),
    provenance.sourceManifest.sha256,
    'Composition fixture source inventory provenance',
  )
  const sourceManifest = JSON.parse(manifestBytes)
  const caseName = 'd3d11-composition-x64'
  const targetArguments = [
    '--composition-swapchain',
    '--noninteractive-tool-popup',
  ]
  const existing = manifest.files.find((file) => file.case === caseName)
  if (
    existing?.sourceSnapshotSha256 === sourceSnapshotSha256 &&
    JSON.stringify(existing.arguments) === JSON.stringify(targetArguments) &&
    fs.existsSync(path.join(directory, existing.path)) &&
    hash(fs.readFileSync(path.join(directory, existing.path))) ===
      existing.sha256
  )
    return
  const upstream = path.join(directory, 'composition-source')
  fs.mkdirSync(upstream, { recursive: true })
  const sources = []
  for (const name of ['d3d11_test_host.cpp', 'input_oracle.hpp']) {
    const sourcePath = `libs/electron-game-overlay-runtime/src/${name}`
    const record = sourceManifest.files.find((file) => file.path === sourcePath)
    assert.ok(record, `SDK source inventory contains ${sourcePath}`)
    const bytes = execFileSync('tar', ['-xOf', archive, sourcePath], {
      windowsHide: true,
    })
    assert.equal(bytes.length, record.size)
    assert.equal(hash(bytes), record.sha256)
    if (name.endsWith('.cpp'))
      for (const argument of targetArguments)
        assert.ok(
          bytes.includes(Buffer.from(argument)),
          `SDK composition host must support ${argument}`,
        )
    fs.writeFileSync(path.join(upstream, name), bytes)
    sources.push({ path: sourcePath, sha256: record.sha256 })
  }
  const build = path.join(directory, 'composition-build')
  execute('cmake', [
    '-S',
    path.join(__dirname, 'native'),
    '-B',
    build,
    '-G',
    'Visual Studio 17 2022',
    '-A',
    'x64',
    `-DUPSTREAM_COMPOSITION_SOURCE=${upstream}`,
  ])
  execute('cmake', [
    '--build',
    build,
    '--config',
    'Release',
    '--parallel',
    '2',
    '--target',
    'owned_composition_test_host',
  ])
  const relative = 'bin/d3d11-composition-x64/owned_composition_test_host.exe'
  const destination = path.join(directory, relative)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(
    path.join(build, 'Release/owned_composition_test_host.exe'),
    destination,
  )
  const bytes = fs.readFileSync(destination)
  assert.equal(bytes.readUInt16LE(bytes.readUInt32LE(0x3c) + 4), 0x8664)
  manifest.files = manifest.files.filter((file) => file.case !== caseName)
  manifest.files.push({
    case: caseName,
    path: relative,
    sha256: hash(bytes),
    sourceSnapshotSha256,
    sources,
    arguments: targetArguments,
  })
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )
}
function buildRefusalFixture(manifest) {
  const requireApp = createRequire(path.join(root, 'apps/app/package.json'))
  const dependency =
    requireApp('./package.json').dependencies['electron-game-overlay']
  assert.ok(dependency.startsWith('file:') && dependency.endsWith('.tgz'))
  const archive = path.resolve(
    root,
    'apps/app',
    dependency.slice(5).replace(/\.tgz$/, '.source.zip'),
  )
  const provenance = JSON.parse(
    fs.readFileSync(
      path.join(
        path.dirname(requireApp.resolve('electron-game-overlay/package.json')),
        'SDK_PROVENANCE.json',
      ),
      'utf8',
    ),
  )
  const hash = (file) =>
    createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  assert.equal(
    hash(archive),
    provenance.sourceSnapshot.sha256,
    'SDK fixture source archive provenance',
  )
  if (
    manifest.refusalFixture?.sourceSnapshotSha256 === hash(archive) &&
    manifest.refusalFixture.files.every(
      (file) =>
        fs.existsSync(path.join(directory, file.path)) &&
        hash(path.join(directory, file.path)) === file.sha256,
    )
  )
    return
  const upstream = path.join(directory, 'access-refusal-source')
  fs.mkdirSync(upstream, { recursive: true })
  const entries = execFileSync('tar', ['-tf', archive], {
    encoding: 'utf8',
    windowsHide: true,
  })
    .trim()
    .split(/\r?\n/)
  for (const name of ['owner.cpp', 'target.cpp']) {
    const matches = entries.filter(
      (entry) =>
        entry ===
        `libs/electron-game-overlay-runtime/tests/unopened-target-selection/${name}`,
    )
    assert.equal(
      matches.length,
      1,
      'Candidate source snapshot contains the owned refusal fixture',
    )
    fs.writeFileSync(
      path.join(upstream, name),
      execFileSync('tar', ['-xOf', archive, matches[0]], { windowsHide: true }),
    )
  }
  const build = path.join(directory, 'input-build')
  execute('cmake', [
    '-S',
    path.join(__dirname, 'native'),
    '-B',
    build,
    '-G',
    'Visual Studio 17 2022',
    '-A',
    'x64',
    `-DUPSTREAM_REFUSAL_SOURCE=${upstream}`,
  ])
  execute('cmake', [
    '--build',
    build,
    '--config',
    'Release',
    '--parallel',
    '2',
    '--target',
    'owned_access_refusal_owner',
    'owned_access_refused_target',
  ])
  manifest.refusalFixture = { sourceSnapshotSha256: hash(archive), files: [] }
  const binaries = path.join(directory, 'access-refusal')
  fs.mkdirSync(binaries, { recursive: true })
  for (const name of [
    'owned_access_refusal_owner.exe',
    'owned_access_refused_target.exe',
  ]) {
    const target = path.join(binaries, name)
    fs.copyFileSync(path.join(build, 'Release', name), target)
    manifest.refusalFixture.files.push({
      path: path.relative(directory, target).replaceAll('\\', '/'),
      sha256: hash(target),
    })
  }
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )
}
if (require.main === module) build()
module.exports = {
  build,
  buildInput,
  buildRefusalFixture,
  buildCompositionFixture,
  inputSourceHash,
  cases,
  directory,
  revision,
}
