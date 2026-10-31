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
  stdout = '{"status":"added","count":6}',
  deferred = false,
  elevation,
} = {}) {
  const warnings = [],
    commands = [],
    events = [],
    dialogsMap = new Map()
  let answer
  const confirmation = deferred
    ? new Promise((resolve) => (answer = resolve))
    : Promise.resolve({ response })
  const api = loadTypescript(
    file,
    {
      electron: {
        app: { getPath: () => 'C:/User/Izabela' },
        dialog: {
          showMessageBox: (options) => {
            warnings.push(options)
            return confirmation
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
          callback(failure, stdout)
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
  return { ...api, warnings, commands, events, dialogsMap, answer }
}

test('plan targets both injector filenames in SDK roots without folder/process exclusions', () => {
  const actual = paths()
  assert.equal(actual.length, 6)
  for (const path of actual) assert.match(path, /\\(?:inject|inject32)\.exe$/)
  assert.equal(actual.filter((p) => p.includes('\\*\\')).length, 4)
  assert.ok(actual.includes('C:\\SDK\\runtime\\inject.exe'))
  assert.ok(actual.includes('C:\\User\\Izabela\\runs\\*\\inject32.exe'))
  assert.equal(
    [
      ...plan.injectorExclusionPaths(
        'C:/SDK/runtime',
        'C:/same/runs',
        'c:/SAME/runs',
      ),
    ].length,
    4,
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

test('native warning defaults to Cancel, lists exact scope and cancel never elevates', async () => {
  const f = fixture()
  const result = await f.addOverlayInjectorDefenderExclusions()
  assert.equal(result.status, 'cancelled')
  assert.equal(f.commands.length, 0)
  const warning = f.warnings[0]
  assert.equal(warning.type, 'warning')
  assert.equal(warning.defaultId, 0)
  assert.equal(warning.cancelId, 0)
  assert.deepEqual([...warning.buttons], ['Cancel', 'Add exclusions'])
  assert.match(warning.detail, /reduces antivirus protection/)
  assert.match(warning.detail, /replacement file/)
  assert.match(warning.detail, /future injector copies/)
  assert.match(warning.detail, /not restored/)
  assert.match(warning.detail, /C:\\SDK\\runtime\\inject32.exe/)
  assert.deepEqual(f.events, ['release'])
  assert.equal(f.dialogsMap.size, 0)
})

test('only explicit native approval runs the fixed command and success must be verified', async () => {
  const f = fixture({ response: 1 })
  assert.equal(
    (await f.addOverlayInjectorDefenderExclusions('C:/arbitrary.exe')).status,
    'added',
  )
  assert.equal(f.commands.length, 1)
  const script = Buffer.from(
    /-EncodedCommand (\S+)$/.exec(f.commands[0].command)[1],
    'base64',
  ).toString('utf16le')
  assert.doesNotMatch(script, /arbitrary/)
  assert.equal(f.commands[0].options.name, 'Izabela Next')
})

test('concurrent renderer calls share one native warning and one elevation request', async () => {
  const f = fixture({ deferred: true })
  const first = f.addOverlayInjectorDefenderExclusions(),
    second = f.addOverlayInjectorDefenderExclusions()
  assert.equal(first, second)
  assert.equal(f.warnings.length, 1)
  assert.equal(f.commands.length, 0)
  f.answer({ response: 1 })
  await first
  assert.equal(f.commands.length, 1)
})

for (const options of [
  { failure: new Error('SECRET') },
  { stdout: 'not JSON' },
  { stdout: '{"status":"added","count":1}' },
]) {
  test('cancelled elevation or unverifiable command output reports failure without exposing raw errors', async () => {
    const f = fixture({ response: 1, ...options })
    const result = await f.addOverlayInjectorDefenderExclusions()
    assert.equal(result.status, 'failed')
    assert.doesNotMatch(result.message, /SECRET|not JSON/)
    assert.equal(f.commands.length, 1)
  })
}

test('unsupported hosts fail before native confirmation or elevation', async () => {
  for (const options of [{ platform: 'linux' }, { arch: 'ia32' }]) {
    const f = fixture(options)
    assert.equal(
      (await f.addOverlayInjectorDefenderExclusions()).status,
      'failed',
    )
    assert.equal(f.warnings.length, 0)
    assert.equal(f.commands.length, 0)
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
  assert.equal(
    (await f.addOverlayInjectorDefenderExclusions()).status,
    'failed',
  )
  const elevationLaunches = launches.filter((command) =>
    command.startsWith('powershell.exe '),
  )
  assert.equal(elevationLaunches.length, 1)
  assert.match(elevationLaunches[0], /Start-Process .* -Verb runAs$/)
})
