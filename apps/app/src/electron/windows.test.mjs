import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { reactive, nextTick } from 'vue'
import * as Vue from 'vue'
import loadTypescript from '../../../../tests/load-typescript.cjs'

const settle = async () => {
  await nextTick()
  await new Promise(setImmediate)
}

function fixture(enabled = false, overlayEnabled = false) {
  const instances = new Map()
  const created = []
  const app = new EventEmitter()
  Object.assign(app, {
    whenReady: () => Promise.resolve(),
    getPath: () => 'fixture-profile',
    commandLine: { appendSwitch() {} },
    disableHardwareAcceleration() {},
  })
  const store = reactive({
    enableGameOverlay: enabled,
    $whenReady: () => Promise.resolve(),
  })
  const settings = reactive({
    enableOverlayWindow: overlayEnabled,
    $whenReady: async () => {},
  })
  let releaseCreation
  let delayCreation = false
  let delayedName = 'messenger-game-overlay'
  const create = async (name) => {
    const window = new EventEmitter()
    Object.assign(window, {
      destroyed: false,
      destroy() {
        this.destroyed = true
        instances.delete(name)
        this.emit('closed')
      },
      isDestroyed() {
        return this.destroyed
      },
      removeAllListeners() {},
    })
    created.push({ name, window })
    if (name === delayedName && delayCreation)
      await new Promise((resolve) => (releaseCreation = resolve))
    return window
  }
  const noop = () => {}
  const nativeOverlay = {
    start: noop,
    quit: noop,
    intercepting: false,
    stops: 0,
    stopIntercept() {
      this.stops++
    },
  }
  const mocks = {
    '@/plugins/node': {},
    electron: {
      app,
      BrowserWindow: { getAllWindows: () => [...instances.values()] },
      protocol: { registerSchemesAsPrivileged() {} },
    },
    'electron-devtools-installer': {},
    '@apps/app-server': { start: noop },
    '@packages/electron-pinia/main': { electronPiniaPlugin: () => ({}) },
    vue: { ...Vue, createApp: () => ({ use: noop }), h: noop },
    pinia: { createPinia: () => ({ use: noop }) },
    '@/teams/tray/electron-tray': noop,
    '@/modules/electron-window-manager': {
      async registerInstance(name, factory) {
        const window = await factory(name)
        const instance = { name, window }
        instances.set(name, instance)
        return instance
      },
      getInstances: () => [...instances.values()],
    },
    '@/teams/messenger/electron/background': {
      createMessengerWindow: create,
      createMessengerGameOverlayWindow: create,
    },
    '@/teams/speech-worker/electron/background': {
      createSpeechWorkerWindow: create,
    },
    '@/electron/bridge': { bridgeModules: noop },
    '@/modules/node-mouse': { stopMouse: noop },
    '@/teams/overlay/electron/background': { createOverlayWindow: create },
    './game-overlay': nativeOverlay,
    '@/electron/game-overlay.ts': nativeOverlay,
    '@/modules/electron-keybinding/utils.ts': {},
    '@/store/stores.ts': { loadStores: noop },
    '@/features/game-overlay/store': { useGameOverlayStore: () => store },
    '@/features/settings/store': { useSettingsStore: () => settings },
    '@/teams/overlay/modules/electron-overlay-window': {
      hide: async () => false,
    },
  }
  for (const name of [
    'startup',
    'updater',
    'debug',
    'display',
    'keybinding',
    'cache',
  ])
    mocks[`@/modules/electron-${name}/register`] = noop
  const controller = loadTypescript(
    fileURLToPath(new URL('./app.ts', import.meta.url)),
    mocks,
    {
      process: Object.assign(new EventEmitter(), {
        env: {},
        platform: 'linux',
      }),
      console: { log: noop, error: noop },
    },
  ).default
  return {
    app,
    store,
    settings,
    controller,
    nativeOverlay,
    instances,
    created,
    delay: (name = 'messenger-game-overlay') => {
      delayCreation = true
      delayedName = name
    },
    release: () => releaseCreation(),
  }
}

test('startup keeps speech available without allocating a disabled game-overlay renderer', async (t) => {
  const f = fixture()
  t.after(() => f.app.emit('before-quit'))
  await f.controller.start()
  await settle()
  assert.deepEqual(f.created.map(({ name }) => name).sort(), [
    'messenger',
    'speech-worker',
  ])
})

test('regular overlay is created only while enabled and can be recreated', async (t) => {
  const f = fixture()
  t.after(() => f.app.emit('before-quit'))
  await f.controller.start()
  assert.equal(
    f.created.some((w) => w.name === 'overlay'),
    false,
  )
  for (let i = 0; i < 2; i++) {
    f.settings.enableOverlayWindow = true
    await settle()
    const current = f.created.filter((w) => w.name === 'overlay').at(-1)
    assert.equal(current.window.isDestroyed(), false)
    f.settings.enableOverlayWindow = false
    await settle()
    assert.equal(current.window.isDestroyed(), true)
  }
  assert.equal(f.created.filter((w) => w.name === 'overlay').length, 2)
})

test('an enabled regular-overlay profile creates one initial renderer', async (t) => {
  const f = fixture(false, true)
  t.after(() => f.app.emit('before-quit'))
  await f.controller.start()
  assert.equal(f.created.filter((w) => w.name === 'overlay').length, 1)
})

test('disabling or quitting while the regular overlay loads destroys the late window', async () => {
  for (const quitting of [false, true]) {
    const f = fixture()
    await f.controller.start()
    f.delay('overlay')
    f.settings.enableOverlayWindow = true
    await settle()
    if (quitting) f.app.emit('before-quit')
    else {
      f.settings.enableOverlayWindow = false
      await settle()
    }
    f.release()
    await settle()
    assert.equal(
      f.created.find((w) => w.name === 'overlay').window.isDestroyed(),
      true,
    )
    f.app.emit('before-quit')
  }
})

test('enabling the game overlay creates its renderer and disabling releases it', async (t) => {
  const f = fixture()
  t.after(() => f.app.emit('before-quit'))
  await f.controller.start()
  f.store.enableGameOverlay = true
  await settle()
  const overlay = f.created.find(
    ({ name }) => name === 'messenger-game-overlay',
  )
  assert.ok(overlay)
  assert.equal(overlay.window.isDestroyed(), false)
  f.store.enableGameOverlay = false
  await settle()
  assert.equal(overlay.window.isDestroyed(), true)
  assert.ok(f.instances.has('speech-worker'))
  f.store.enableGameOverlay = true
  await settle()
  assert.equal(
    f.created.filter(({ name }) => name === 'messenger-game-overlay').length,
    2,
  )
})

test('an enabled profile starts one overlay renderer', async (t) => {
  const f = fixture(true)
  t.after(() => f.app.emit('before-quit'))
  await f.controller.start()
  await settle()
  assert.equal(
    f.created.filter(({ name }) => name === 'messenger-game-overlay').length,
    1,
  )
})

test('disabling an active overlay releases native input interception', async (t) => {
  const f = fixture(true)
  t.after(() => f.app.emit('before-quit'))
  await f.controller.start()
  f.nativeOverlay.intercepting = true
  f.store.enableGameOverlay = false
  await settle()
  assert.equal(f.nativeOverlay.stops, 1)
})

test('disabling cancels a pending native intercept before destroying the renderer', async (t) => {
  const f = fixture(true)
  t.after(() => f.app.emit('before-quit'))
  await f.controller.start()
  const window = f.created.find(
    ({ name }) => name === 'messenger-game-overlay',
  ).window
  // A start command has been sent but its native acknowledgement is pending.
  assert.equal(f.nativeOverlay.intercepting, false)
  window.once('closed', () => assert.equal(f.nativeOverlay.stops, 1))
  f.store.enableGameOverlay = false
  await settle()
  assert.equal(f.nativeOverlay.stops, 1)
  assert.equal(window.isDestroyed(), true)
})

test('rapid toggles coalesce creation and destroy a late disabled renderer', async (t) => {
  const f = fixture()
  t.after(() => f.app.emit('before-quit'))
  await f.controller.start()
  f.delay()
  f.store.enableGameOverlay = true
  await settle()
  f.store.enableGameOverlay = false
  await settle()
  f.store.enableGameOverlay = true
  await settle()
  f.store.enableGameOverlay = false
  await settle()
  assert.equal(
    f.created.filter(({ name }) => name === 'messenger-game-overlay').length,
    1,
  )
  f.release()
  await settle()
  assert.ok(
    f.created
      .find(({ name }) => name === 'messenger-game-overlay')
      .window.isDestroyed(),
  )
})

test('quit stops feature watching and destroys a late-created renderer', async () => {
  const f = fixture()
  await f.controller.start()
  f.delay()
  f.store.enableGameOverlay = true
  await settle()
  f.app.emit('before-quit')
  f.release()
  await settle()
  assert.ok(
    f.created
      .find(({ name }) => name === 'messenger-game-overlay')
      .window.isDestroyed(),
  )
  f.store.enableGameOverlay = false
  await settle()
  f.store.enableGameOverlay = true
  await settle()
  assert.equal(
    f.created.filter(({ name }) => name === 'messenger-game-overlay').length,
    1,
  )
})
