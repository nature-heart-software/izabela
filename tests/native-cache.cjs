const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const { existsSync, mkdtempSync, readFileSync, rmSync } = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const temporary = mkdtempSync(path.join(os.tmpdir(), 'nx-native-'))
const nx = require.resolve('nx/bin/nx.js')
const environment = {
  ...process.env,
  NX_CACHE_DIRECTORY: path.join(temporary, 'cache'),
  NX_WORKSPACE_DATA_DIRECTORY: path.join(temporary, 'workspace-data'),
  NX_SKIP_NX_CACHE: 'false',
  NX_SKIP_REMOTE_CACHE: 'true',
  NX_DAEMON: 'false',
  NX_TUI: 'false',
}
const targets = [
  {
    task: '@packages/native-keymap:build',
    outputs: ['packages/native-keymap/build/Release/keymapping.node'],
    remove: ['packages/native-keymap/build'],
  },
  {
    task: 'win-control:build',
    outputs: [
      'packages/win-control/build/Release/wincontrol.node',
      'packages/win-control/lib/binding/wincontrol.node',
    ],
    remove: [
      'packages/win-control/build',
      'packages/win-control/lib/binding/wincontrol.node',
    ],
  },
  {
    task: '@packages/electron-game-overlay:build',
    outputs: [
      'packages/electron-game-overlay/dist/index.cjs',
      'packages/electron-game-overlay/dist/index.js',
      'packages/electron-game-overlay/dist/index.d.ts',
      'packages/electron-game-overlay/dist/electron-overlay.node',
      'packages/electron-game-overlay/dist/injector_helper.exe',
      'packages/electron-game-overlay/dist/injector_helper.x64.exe',
      'packages/electron-game-overlay/dist/n_overlay.dll',
      'packages/electron-game-overlay/dist/n_overlay.x64.dll',
    ],
    remove: [
      'packages/electron-game-overlay/dist',
      'packages/electron-game-overlay/build',
    ],
  },
  {
    task: 'izabela-next:rebuild-native',
    outputs: ['apps/app/node_modules/forcefocus/build/Release/forcefocus.node'],
    remove: ['apps/app/node_modules/forcefocus/build/Release/forcefocus.node'],
  },
]
const cacheHit = /\[(?:local|remote) cache(?:[^\]]*)\]/

function run(task, extraEnvironment = {}) {
  const result = spawnSync(
    process.execPath,
    [nx, 'run', task, '--outputStyle=static'],
    {
      cwd: root,
      env: { ...environment, ...extraEnvironment },
      encoding: 'utf8',
      windowsHide: true,
      timeout: 10 * 60 * 1000,
      maxBuffer: 20 * 1024 * 1024,
    },
  )
  const output = ((result.stdout || '') + (result.stderr || '')).replace(
    /\u001b\[[0-9;]*m/g,
    '',
  )
  process.stdout.write(output)
  assert.ifError(result.error)
  assert.equal(result.status, 0, task)
  return output
}

function digest(file) {
  const absolute = path.resolve(root, file)
  assert.ok(existsSync(absolute), `missing cached output: ${file}`)
  return createHash('sha256').update(readFileSync(absolute)).digest('hex')
}

function removeOutputs(target) {
  for (const file of target.remove) {
    const absolute = path.resolve(root, file)
    assert.ok(
      absolute.startsWith(root + path.sep),
      `unexpected cleanup: ${absolute}`,
    )
    rmSync(absolute, { recursive: true, force: true })
  }
  for (const file of target.outputs)
    assert.equal(existsSync(path.resolve(root, file)), false, file)
}

try {
  assert.equal(
    process.platform,
    'win32',
    'native desktop cache validation requires Windows',
  )
  const hashes = new Map()
  for (const target of targets) {
    assert.doesNotMatch(
      run(target.task),
      cacheHit,
      `expected a cold build: ${target.task}`,
    )
    for (const output of target.outputs) hashes.set(output, digest(output))
  }
  for (const target of targets) {
    removeOutputs(target)
    assert.match(
      run(target.task),
      cacheHit,
      `expected a cache hit: ${target.task}`,
    )
    for (const output of target.outputs)
      assert.equal(digest(output), hashes.get(output), output)
    console.log(
      `PASS native cache: ${target.task} restored all outputs with identical SHA-256`,
    )
  }

  // A real compiler option must invalidate the key, even with unchanged sources.
  const keymap = targets[0]
  assert.doesNotMatch(
    run(keymap.task, {
      CL: `${process.env.CL || ''} /DIZABELA_NATIVE_CACHE_PROBE=1`,
    }),
    cacheHit,
    'compiler options must invalidate native caches',
  )
  removeOutputs(keymap)
  assert.match(
    run(keymap.task),
    cacheHit,
    'original compiler environment must reuse its own cache',
  )
  for (const output of keymap.outputs)
    assert.equal(digest(output), hashes.get(output), output)
  console.log(
    'PASS native cache: changing compiler options misses; restoring them hits the original cache',
  )

  const runtime = spawnSync(require('electron'), ['tests/native-runtime.cjs'], {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 60000,
  })
  process.stdout.write((runtime.stdout || '') + (runtime.stderr || ''))
  assert.ifError(runtime.error)
  assert.equal(
    runtime.status,
    0,
    'restored native binaries must run in Electron',
  )
} finally {
  assert.ok(temporary.startsWith(path.join(os.tmpdir(), 'nx-native-')))
  rmSync(temporary, { recursive: true, force: true })
}
