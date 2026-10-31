const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')

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
      .filter((c) => c.endsWith(arch))
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
  console.log(`Built controlled graphics fixtures: ${directory}`)
  return directory
}
function inputSourceHash() {
  return createHash('sha256')
    .update(fs.readFileSync(path.join(__dirname, 'native/input.cpp')))
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
  manifest.inputSourceSha256 = inputSourceHash()
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )
}
if (require.main === module) build()
module.exports = {
  build,
  buildInput,
  inputSourceHash,
  cases,
  directory,
  revision,
}
