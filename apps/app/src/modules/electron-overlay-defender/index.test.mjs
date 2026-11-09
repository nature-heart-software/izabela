import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const file = fileURLToPath(new URL('./index.ts', import.meta.url))
const plan = loadTypescript(
  fileURLToPath(new URL('./plan.ts', import.meta.url)),
)
const paths = () => [
  ...plan.injectorExclusionPaths(
    'C:/SDK/runtime',
    'C:/User/Izabela/runs',
    'C:/User/Temp/electron-game-overlay/reshade-runs',
  ),
]
function fixture({
  response = 0,
  platform = 'win32',
  arch = 'x64',
  failure,
  stdout = '{"status":"added","count":3}',
  deferred = false,
  elevation,
} = {}) {
  const warnings = [],
    commands = [],
    events = [],
    dialogsMap = new Map()
  let answer
  const api = loadTypescript(
    file,
    {
      electron: {
        app: {
          isPackaged: true,
          getAppPath: () => 'C:/SDK',
          getPath: (name) =>
            name === 'exe' ? 'C:/SDK/Izabela.exe' : 'C:/User/Izabela',
        },
        dialog: {
          showMessageBox: (options) => {
            warnings.push(options)
            throw new Error('Native explanation dialogs must not be opened')
          },
        },
      },
      koffi: {
        load: (name) => {
          assert.equal(name, 'kernel32.dll')
          return {
            func: () => (buffer) => {
              const value = 'C:\\Windows\\System32'
              Buffer.from(value, 'utf16le').copy(buffer)
              return value.length
            },
          }
        },
      },
      '@vscode/sudo-prompt': elevation || {
        exec: (command, options, callback) => {
          commands.push({ command, options })
          if (deferred) answer = () => callback(failure, stdout)
          else callback(failure, stdout)
        },
      },
      '@/electron/game-overlay-backend': {
        stopIntercept: () => events.push('release'),
      },
      '@/modules/electron-dialog': { dialogsMap },
      'electron-game-overlay': {
        defaultReShadeRuntimeDirectory: () => 'C:/SDK/runtime',
        defaultReShadeRunsRootDirectory: () =>
          'C:/User/Temp/electron-game-overlay/reshade-runs',
      },
    },
    { process: { platform, arch, env: { SystemRoot: 'C:\\Windows' } } },
  )
  return {
    ...api,
    warnings,
    commands,
    events,
    dialogsMap,
    answer: () => answer(),
  }
}

test('plan wildcards injector filenames and launch folders without folder/process exclusions', () => {
  const actual = paths()
  assert.equal(actual.length, 3)
  for (const path of actual) assert.match(path, /\\inject\*\.exe$/)
  assert.equal(actual.filter((p) => p.includes('\\*\\')).length, 2)
  assert.ok(actual.includes('C:\\SDK\\runtime\\inject*.exe'))
  assert.ok(actual.includes('C:\\User\\Izabela\\runs*\\*\\inject*.exe'))
  assert.ok(
    actual.includes(
      'C:\\User\\Temp\\electron-game-overlay\\reshade-runs*\\*\\inject*.exe',
    ),
  )
  assert.deepEqual(actual, [
    ...plan.injectorExclusionPaths(
      'C:/SDK/runtime/',
      'C:/User/Izabela/runs/',
      'C:/User/Temp/electron-game-overlay/reshade-runs/',
    ),
  ])
  assert.equal(
    [
      ...plan.injectorExclusionPaths(
        'C:/SDK/runtime',
        'C:/same/runs',
        'c:/SAME/runs',
      ),
    ].length,
    2,
  )
})

test('SDK source wildcard survives pnpm version changes while retaining the exact package and runtime layout', () => {
  const source = (version) =>
    `C:/Izabela/node_modules/.pnpm/electron-game-overlay@${version}/node_modules/electron-game-overlay/dist/runtime/win32-x64/reshade`
  const first = [
    ...plan.injectorExclusionPaths(
      source('file+vendor+rc.12_electron@46'),
      'C:/Izabela/runs',
      'C:/Shared/runs',
    ),
  ]
  const upgraded = [
    ...plan.injectorExclusionPaths(
      source('file+vendor+nightly.2_electron@46'),
      'C:/Izabela/runs',
      'C:/Shared/runs',
    ),
  ]
  assert.deepEqual(first, upgraded)
  assert.equal(
    first[0],
    'C:\\Izabela\\node_modules\\.pnpm\\electron-game-overlay@*\\node_modules\\electron-game-overlay\\dist\\runtime\\win32-x64\\reshade\\inject*.exe',
  )
  const installed = [
    ...plan.injectorExclusionPaths(
      'C:/Izabela/resources/app.asar.unpacked/node_modules/electron-game-overlay/dist/runtime/win32-x64/reshade',
      'C:/Izabela/runs',
      'C:/Shared/runs',
    ),
  ]
  assert.equal(
    installed[0],
    'C:\\Izabela\\resources\\app.asar.unpacked\\node_modules\\electron-game-overlay\\dist\\runtime\\win32-x64\\reshade\\inject*.exe',
  )
})

test('ambiguous, wildcard, environment-expanded and drive-root directories are rejected', () => {
  for (const bad of [
    'C:/',
    '../runs',
    'C:/temp/*',
    'C:/%TEMP%/runs',
    'C:/bad?/runs',
    'C:/bad\n/runs',
    '\\\\server\\share\\runs',
  ])
    assert.throws(
      () => plan.injectorExclusionPaths(bad, 'C:/User/runs', 'C:/User/shared'),
      /Unsupported/,
    )
})

test('command encodes all path data separately, preserves other settings and verifies the result', () => {
  const unusual = "C:\\User\\O'Brien & $() `name\\runs\\*\\inject.exe"
  const command = plan.defenderExclusionCommand(
    [unusual],
    'C:\\Windows\\System32',
  )
  assert.match(
    command,
    /^"C:\\Windows\\System32\\WindowsPowerShell\\v1\.0\\powershell\.exe" /,
  )
  const encoded = /-EncodedCommand ([A-Za-z0-9+/=]+)$/.exec(command)[1]
  const script = Buffer.from(encoded, 'base64').toString('utf16le')
  const data = /FromBase64String\('([A-Za-z0-9+/=]+)'\)/.exec(script)[1]
  assert.deepEqual(JSON.parse(Buffer.from(data, 'base64').toString('utf8')), [
    unusual,
  ])
  assert.doesNotMatch(
    script,
    /O'Brien|ExclusionProcess|ExclusionExtension|Set-MpPreference|DisableRealtime|ExecutionPolicy|Invoke-Expression/,
  )
  assert.match(
    script,
    /Add-MpPreference -ExclusionPath \$missing -ErrorAction Stop/,
  )
  assert.equal((script.match(/Get-MpPreference/g) || []).length, 2)
  assert.throws(
    () => plan.defenderExclusionCommand(paths(), 'C:\\Windows" & arbitrary'),
    /Unsupported/,
  )
})

async function approve(f) {
  const preview = await f.prepareOverlayInjectorDefenderExclusions()
  assert.equal(preview.status, 'ready')
  return f.addOverlayInjectorDefenderExclusions(preview.token)
}

test('preparing confirmation opens no native dialog and never elevates or releases input', async () => {
  const f = fixture()
  const preview = await f.prepareOverlayInjectorDefenderExclusions()
  assert.equal(preview.status, 'ready')
  assert.equal(typeof preview.token, 'string')
  assert.equal('paths' in preview, false)
  assert.equal(f.warnings.length, 0)
  assert.equal(f.commands.length, 0)
  assert.deepEqual(f.events, [])
  assert.equal(
    (await f.addOverlayInjectorDefenderExclusions('C:/arbitrary.exe')).status,
    'failed',
  )
  assert.equal(f.commands.length, 0)
})

test('confirmation uses the prepared main-owned paths, never a renderer-modified preview', async () => {
  const f = fixture()
  const preview = await f.prepareOverlayInjectorDefenderExclusions()
  preview.paths = ['C:/arbitrary.exe']
  assert.equal(
    (await f.addOverlayInjectorDefenderExclusions(preview.token)).status,
    'added',
  )
  const script = Buffer.from(
    /-EncodedCommand (\S+)$/.exec(f.commands[0].command)[1],
    'base64',
  ).toString('utf16le')
  assert.doesNotMatch(script, /arbitrary/)
  assert.equal(f.commands[0].options.name, 'Izabela Next')
  assert.deepEqual(f.events, ['release'])
  assert.equal(
    (await f.addOverlayInjectorDefenderExclusions(preview.token)).status,
    'failed',
  )
  assert.equal(f.commands.length, 1)
})

test('concurrent confirmations share one elevation request for the same plan', async () => {
  const f = fixture({ deferred: true })
  const preview = await f.prepareOverlayInjectorDefenderExclusions()
  const first = f.addOverlayInjectorDefenderExclusions(preview.token),
    second = f.addOverlayInjectorDefenderExclusions(preview.token)
  assert.equal(first, second)
  assert.equal(f.commands.length, 1)
  assert.equal(f.warnings.length, 0)
  f.answer()
  await first
})

for (const options of [
  { failure: new Error('SECRET') },
  { stdout: 'not JSON' },
  { stdout: '{"status":"added","count":1}' },
])
  test('cancelled elevation or unverifiable output reports failure without exposing raw errors', async () => {
    const f = fixture(options),
      result = await approve(f)
    assert.equal(result.status, 'failed')
    assert.doesNotMatch(result.message, /SECRET|not JSON/)
    assert.equal(f.commands.length, 1)
  })

test('unsupported hosts fail before preview or elevation', async () => {
  for (const options of [{ platform: 'linux' }, { arch: 'ia32' }]) {
    const f = fixture(options)
    assert.equal(
      (await f.prepareOverlayInjectorDefenderExclusions()).status,
      'failed',
    )
    assert.equal(f.commands.length, 0)
    assert.deepEqual(f.events, [])
  }
})

test('real elevation dependency reaches Windows UAC launch on the current Node runtime', async (t) => {
  const require = createRequire(import.meta.url)
  const filename = require.resolve('@vscode/sudo-prompt')
  const directory = mkdtempSync(join(tmpdir(), 'izabela-elevation-test-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const launches = []
  const module = { exports: {} }
  // Exercise the installed library, including its argument validation and
  // Windows command files. Block the actual process launch/UAC boundary.
  runInNewContext(readFileSync(filename, 'utf8'), {
    module,
    exports: module.exports,
    process: {
      platform: 'win32',
      title: 'Izabela Next',
      cwd: () => directory,
      env: {},
    },
    require(id) {
      if (id === 'os') return { tmpdir: () => directory }
      if (id === 'child_process')
        return {
          exec(command, options, callback) {
            launches.push(command)
            queueMicrotask(() =>
              callback(new Error('Controlled UAC cancellation')),
            )
            return { stdin: { end() {} } }
          },
        }
      return require(id)
    },
    Buffer,
    setTimeout,
  })
  const f = fixture({ response: 1, elevation: module.exports })
  assert.equal((await approve(f)).status, 'failed')
  const elevationLaunches = launches.filter((command) =>
    command.startsWith('powershell.exe '),
  )
  assert.equal(elevationLaunches.length, 1)
  assert.match(elevationLaunches[0], /Start-Process .* -Verb runAs$/)
})
