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

function fixture(enabled = false) {
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
  let releaseCreation
  let delayCreation = false
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
    if (name === 'messenger-game-overlay' && delayCreation)
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
    controller,
    nativeOverlay,
    instances,
    created,
    delay: () => (delayCreation = true),
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
    'overlay',
    'speech-worker',
  ])
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
