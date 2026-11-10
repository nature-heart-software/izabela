import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

function fixture({
  experimental = false,
  elevated = false,
  runAsAdmin = true,
  launchSucceeds = false,
} = {}) {
  const hydrated = deferred(),
    calls = []
  const settings = {
    runAsAdmin,
    launchOnStartup: false,
    $whenReady: () => hydrated.promise,
  }
  const register = loadTypescript(
    fileURLToPath(new URL('./register.ts', import.meta.url)),
    {
      vue: { watch() {} },
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/features/game-overlay/store': {
        useGameOverlayStore: () => ({
          enableExperimentalGameOverlay: experimental,
          $whenReady: () => {
            throw new Error(
              'Overlay settings must not govern administrator startup',
            )
          },
        }),
      },
      electron: {
        app: {
          whenReady: () => Promise.resolve(),
          getPath: () => 'C:/Izabela/Izabela Next.exe',
          setLoginItemSettings: () => calls.push('login'),
          releaseSingleInstanceLock: () => calls.push('release-lock'),
          requestSingleInstanceLock: () => {
            calls.push('acquire-lock')
            return true
          },
          quit: () => calls.push('quit'),
        },
      },
      child_process: {
        exec(command, callback) {
          calls.push({ command })
          callback(launchSucceeds ? null : new Error('Fixture denies UAC'))
        },
      },
      '@packages/toolbox': { Deferred: deferred },
      '@/electron/utils.ts': { isRunningAsAdmin: () => elevated },
      'electron-game-overlay': {
        inspectOverlayConsumerExecutionContext() {
          throw new Error('Startup must not change elevation for the SDK')
        },
        launchUnelevatedOverlayConsumer() {
          throw new Error('Startup must not force de-elevation')
        },
      },
    },
    {
      process: { platform: 'win32', execPath: 'C:/Izabela/Izabela Next.exe' },
      console: { log() {}, error() {} },
      __importMetaEnv: { PROD: true },
    },
  ).default
  return { register, settings, hydrated, calls }
}

for (const experimental of [false, true]) {
  test(
    'saved administrator startup is honored with experimental=' + experimental,
    async () => {
      const f = fixture({ experimental })
      f.hydrated.resolve()
      await f.register()
      assert.equal(f.settings.runAsAdmin, true)
      assert.equal(f.calls.length, 2)
      assert.equal(f.calls[0], 'login')
      assert.match(f.calls[1].command, /-Verb RunAs/)
    },
  )

  test(
    'already elevated startup stays elevated with experimental=' + experimental,
    async () => {
      const f = fixture({ experimental, elevated: true })
      f.hydrated.resolve()
      await f.register()
      assert.equal(f.settings.runAsAdmin, true)
      assert.deepEqual(f.calls, ['login'])
    },
  )

  test(
    'manual elevated launch is not replaced with experimental=' + experimental,
    async () => {
      const f = fixture({ experimental, elevated: true, runAsAdmin: false })
      f.hydrated.resolve()
      await f.register()
      assert.equal(f.settings.runAsAdmin, false)
      assert.deepEqual(f.calls, ['login'])
    },
  )
}

test('startup waits for the saved preference before requesting elevation', async () => {
  const f = fixture({ experimental: true, runAsAdmin: false })
  const startup = f.register()
  await Promise.resolve()
  await Promise.resolve()
  assert.deepEqual(f.calls, [])
  f.settings.runAsAdmin = true
  f.hydrated.resolve()
  await startup
  assert.equal(f.settings.runAsAdmin, true)
  assert.match(f.calls[1].command, /-Verb RunAs/)
})

test('disabled administrator startup remains disabled', async () => {
  const f = fixture({ experimental: true, runAsAdmin: false })
  f.hydrated.resolve()
  await f.register()
  assert.equal(f.settings.runAsAdmin, false)
  assert.deepEqual(f.calls, ['login'])
})

test('successful administrator launch quits the old process without resetting the preference', async () => {
  const f = fixture({ experimental: true, launchSucceeds: true })
  f.hydrated.resolve()
  let continued = false
  void f.register().then(() => {
    continued = true
  })
  await new Promise(setImmediate)
  assert.equal(f.settings.runAsAdmin, true)
  assert.equal(f.calls.at(-1), 'quit')
  assert.equal(continued, false)
})
