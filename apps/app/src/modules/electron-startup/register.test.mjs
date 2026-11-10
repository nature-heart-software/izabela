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
  relaunchAvailable = true,
  launchError,
  launchStatus = 'launched',
  lockAvailable = true,
} = {}) {
  const hydrated = deferred()
  const calls = []
  const settings = {
    runAsAdmin: true,
    launchOnStartup: false,
    $whenReady: () => Promise.resolve(),
  }
  const overlay = {
    enableExperimentalGameOverlay: experimental,
    $whenReady: () => hydrated.promise,
  }
  const register = loadTypescript(
    fileURLToPath(new URL('./register.ts', import.meta.url)),
    {
      vue: { watch() {} },
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/features/game-overlay/store': { useGameOverlayStore: () => overlay },
      electron: {
        app: {
          whenReady: () => Promise.resolve(),
          getPath: () => 'C:/Izabela/Izabela Next.exe',
          setLoginItemSettings: () => calls.push('login'),
          releaseSingleInstanceLock: () => calls.push('release-lock'),
          requestSingleInstanceLock: () => {
            calls.push('acquire-lock')
            return lockAvailable
          },
          quit: () => calls.push('quit'),
        },
      },
      child_process: {
        exec(command, callback) {
          calls.push({ command })
          callback(new Error('Fixture denies elevation'))
        },
      },
      '@packages/toolbox': { Deferred: deferred },
      '@/electron/utils.ts': { isRunningAsAdmin: () => elevated },
      'electron-game-overlay': {
        async inspectOverlayConsumerExecutionContext() {
          calls.push('context')
          return {
            overlaySupported: !elevated,
            relaunchAvailable,
            relaunchRefusal: relaunchAvailable ? null : 'shell-unavailable',
          }
        },
        async launchUnelevatedOverlayConsumer() {
          calls.push('launch')
          if (launchError) throw launchError
          return { status: launchStatus }
        },
      },
    },
    {
      process: { platform: 'win32', execPath: 'C:/Izabela/Izabela Next.exe' },
      console: { log() {}, info() {}, error() {} },
      __importMetaEnv: { PROD: true },
    },
  ).default
  return { register, settings, overlay, hydrated, calls }
}

test('startup waits for overlay hydration before deciding whether to elevate', async () => {
  const f = fixture()
  const startup = f.register()
  await Promise.resolve()
  await Promise.resolve()
  assert.deepEqual(f.calls, [])
  f.overlay.enableExperimentalGameOverlay = true
  f.hydrated.resolve()
  await startup
  assert.equal(f.settings.runAsAdmin, false)
  assert.deepEqual(f.calls, ['context', 'login'])
})

test('experimental startup clears a stale administrator preference before services start', async () => {
  const f = fixture({ experimental: true })
  f.hydrated.resolve()
  await f.register()
  assert.equal(f.settings.runAsAdmin, false)
  assert.deepEqual(f.calls, ['context', 'login'])
})

test('legacy startup retains the requested elevation behavior', async () => {
  const f = fixture()
  f.hydrated.resolve()
  await f.register()
  assert.equal(f.settings.runAsAdmin, true)
  assert.equal(f.calls.length, 2)
  assert.equal(f.calls[0], 'login')
  assert.match(f.calls[1].command, /-Verb RunAs/)
})

test('already elevated legacy startup does not request elevation again', async () => {
  const f = fixture({ elevated: true })
  f.hydrated.resolve()
  await f.register()
  assert.deepEqual(f.calls, ['login'])
})

test('elevated experimental startup hands off before starting services', async () => {
  const f = fixture({ experimental: true, elevated: true })
  f.hydrated.resolve()
  let continued = false
  void f.register().then(() => {
    continued = true
  })
  await new Promise(setImmediate)
  assert.equal(f.settings.runAsAdmin, false)
  assert.deepEqual(f.calls, ['context', 'release-lock', 'launch', 'quit'])
  assert.equal(continued, false, 'Old elevated process must not start services')
})

test('failed handoff reacquires the lock and leaves the original app running', async () => {
  const f = fixture({
    experimental: true,
    elevated: true,
    launchError: new Error('Owned child token verification failed'),
  })
  f.hydrated.resolve()
  await f.register()
  assert.deepEqual(f.calls, [
    'context',
    'release-lock',
    'launch',
    'acquire-lock',
    'login',
  ])
})

test('unavailable normal-permission launch never releases the app lock', async () => {
  const f = fixture({
    experimental: true,
    elevated: true,
    relaunchAvailable: false,
  })
  f.hydrated.resolve()
  await f.register()
  assert.deepEqual(f.calls, ['context', 'login'])
})

test('already-normal SDK result reacquires the lock before continuing', async () => {
  const f = fixture({
    experimental: true,
    elevated: true,
    launchStatus: 'already-unelevated',
  })
  f.hydrated.resolve()
  await f.register()
  assert.deepEqual(f.calls, [
    'context',
    'release-lock',
    'launch',
    'acquire-lock',
    'login',
  ])
})

test('a competing instance after failed handoff prevents this process starting services', async () => {
  const f = fixture({
    experimental: true,
    elevated: true,
    launchError: new Error('Launch failed'),
    lockAvailable: false,
  })
  f.hydrated.resolve()
  let continued = false
  void f.register().then(() => {
    continued = true
  })
  await new Promise(setImmediate)
  assert.deepEqual(f.calls, [
    'context',
    'release-lock',
    'launch',
    'acquire-lock',
    'quit',
  ])
  assert.equal(continued, false)
})
