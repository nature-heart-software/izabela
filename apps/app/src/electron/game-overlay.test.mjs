import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { reactive, watch } from 'vue'
import loadTypescript from '../../../../tests/load-typescript.cjs'

function fixture({
  getMousePosition = async () => ({ x: 0, y: 0 }),
  setMousePosition = async () => {},
  onResize = () => {},
} = {}) {
  let nativeEvent
  let resizes = 0
  let focuses = 0
  let clicks = 0
  const moves = []
  const commands = []
  const sizes = []
  class BrowserWindow extends EventEmitter {
    constructor() {
      super()
      this.loading = true
      this.destroyed = false
      this.webContents = Object.assign(new EventEmitter(), {
        isLoadingMainFrame: () => this.loading,
      })
    }
    isDestroyed() {
      return this.destroyed
    }
    finishLoad() {
      this.loading = false
      this.webContents.emit('did-finish-load')
    }
    destroy() {
      this.destroyed = true
      this.emit('closed')
    }
  }
  const store = reactive({
    enableGameOverlay: false,
    $whenReady: async () => {},
  })
  const native = {
    start() {},
    stop() {},
    setEventCallback: (callback) => (nativeEvent = callback),
    sendCommand: (command) => commands.push({ ...command }),
  }
  const overlay = loadTypescript(
    fileURLToPath(new URL('./game-overlay.ts', import.meta.url)),
    {
      electron: {
        BrowserWindow,
        screen: { getDisplayNearestPoint: () => ({ scaleFactor: 1 }) },
      },
      '@/electron/events/main.ts': {
        emitIPCGameOverlayResize: (size) => {
          onResize(size)
          resizes++
          sizes.push({ ...size })
        },
        onIPCGameOverlayStartIntercept() {},
        onIPCGameOverlayStopIntercept() {},
      },
      '@nut-tree-fork/nut-js': {
        mouse: {
          getPosition: getMousePosition,
          setPosition: async (position) => {
            moves.push(position)
            await setMousePosition(position)
          },
          leftClick: async () => {
            clicks++
          },
        },
        Point: class {},
      },
      child_process: {
        fork: () => Object.assign(new EventEmitter(), { kill() {} }),
      },
      '@packages/toolbox': {
        Deferred() {
          let resolve
          const promise = new Promise((done) => (resolve = done))
          return { promise, resolve }
        },
      },
      '@/features/game-overlay/store': { useGameOverlayStore: () => store },
      vue: { watch, onWatcherCleanup() {} },
      '@/features/databases/store': { useDatabasesStore: () => ({ data: {} }) },
      '@packages/electron-game-overlay': native,
      'win-control': {
        Window: {
          getByPid: () => ({
            getDimensions: () => ({
              top: 0,
              left: 0,
              right: 1920,
              bottom: 1080,
            }),
          }),
        },
      },
    },
    { queueMicrotask, console: { log() {} } },
  ).default
  return {
    overlay,
    store,
    event: (...args) => nativeEvent(...args),
    resizes: () => resizes,
    commands,
    sizes,
    moves,
    clicks: () => clicks,
    focuses: () => focuses,
    loadedRenderer() {
      const window = {
        isDestroyed: () => false,
        webContents: { isLoadingMainFrame: () => false },
        close() {},
        blurWebView() {},
        focusOnWebView: () => focuses++,
      }
      overlay.windows.set('messenger-game-overlay', window)
      return window
    },
    renderer(window) {
      overlay.windows.set('messenger-game-overlay', window)
    },
  }
}

test('an enabled loaded overlay still focuses and clicks before restoring the cursor', async () => {
  const f = fixture()
  await f.overlay.start()
  f.store.enableGameOverlay = true
  f.loadedRenderer()
  f.overlay.startIntercept()
  f.event('game.input.intercept', { pid: 123, intercepting: true })
  await new Promise(setImmediate)
  assert.equal(f.overlay.intercepting, true)
  assert.equal(f.focuses(), 1)
  assert.equal(f.moves.length, 2)
  assert.equal(f.clicks(), 1)
  f.overlay.stopIntercept()
  assert.equal(f.overlay.intercepting, false)
  f.event('game.input.intercept', { pid: 123, intercepting: false })
  assert.equal(f.overlay.intercepting, false)
})

test('cancelling interception is safe before native startup', () => {
  const f = fixture()
  assert.doesNotThrow(() => f.overlay.stopIntercept())
  assert.equal(f.overlay.intercepting, false)
})

test('a cancelled pending intercept rejects a late true acknowledgement even after re-enable', async () => {
  const f = fixture()
  await f.overlay.start()
  f.store.enableGameOverlay = true
  f.loadedRenderer()
  f.overlay.startIntercept()
  assert.equal(f.commands.at(-1).intercept, true)
  assert.equal(f.overlay.intercepting, false)
  f.store.enableGameOverlay = false
  f.overlay.stopIntercept()
  assert.equal(f.commands.at(-1).intercept, false)
  f.store.enableGameOverlay = true
  f.event('game.input.intercept', { pid: 123, intercepting: true })
  assert.equal(f.overlay.intercepting, false)
  assert.equal(f.commands.at(-1).intercept, false)
  assert.equal(f.commands.length, 3)
  assert.equal(f.focuses(), 0)
})

for (const state of [
  'disabled',
  'absent',
  'loading',
  'destroyed',
  'quitting',
]) {
  const invalidate = (f, window) => {
    if (state === 'disabled') f.store.enableGameOverlay = false
    if (state === 'absent') f.overlay.windows.clear()
    if (state === 'loading') window.webContents.isLoadingMainFrame = () => true
    if (state === 'destroyed') window.isDestroyed = () => true
    if (state === 'quitting') f.overlay.quit()
  }

  test(`interception cannot start with a ${state} optional renderer`, async () => {
    const f = fixture()
    await f.overlay.start()
    f.store.enableGameOverlay = true
    const window = f.loadedRenderer()
    invalidate(f, window)
    f.overlay.startIntercept()
    assert.equal(
      f.commands.some(({ intercept }) => intercept === true),
      false,
    )
  })

  test(`a pending true acknowledgement is cancelled with a ${state} optional renderer`, async () => {
    const f = fixture()
    await f.overlay.start()
    f.store.enableGameOverlay = true
    const window = f.loadedRenderer()
    f.overlay.startIntercept()
    assert.equal(f.commands.at(-1).intercept, true)
    invalidate(f, window)
    f.event('game.input.intercept', { pid: 123, intercepting: true })
    assert.equal(f.overlay.intercepting, false)
    assert.equal(f.commands.at(-1).intercept, false)
    assert.equal(f.focuses(), 0)
  })
}

test('renderer readiness replays the latest viewport received while absent or loading', async () => {
  const f = fixture()
  await f.overlay.start()
  f.event('graphics.window', { pid: 123, width: 1280, height: 720 })
  const old = f.overlay.createWindow('messenger-game-overlay', {})
  f.event('graphics.window.event.resize', {
    pid: 123,
    width: 1600,
    height: 900,
  })
  assert.equal(f.resizes(), 0)
  old.finishLoad()
  await Promise.resolve()
  assert.deepEqual(f.sizes, [{ width: 1600, height: 900 }])
  old.destroy()
  f.event('graphics.window.event.resize', {
    pid: 123,
    width: 1920,
    height: 1080,
  })
  const replacement = f.overlay.createWindow('messenger-game-overlay', {})
  old.finishLoad()
  await Promise.resolve()
  assert.equal(f.resizes(), 1)
  replacement.finishLoad()
  await Promise.resolve()
  assert.deepEqual(f.sizes.at(-1), { width: 1920, height: 1080 })
  assert.equal(f.resizes(), 2)
})

test('viewport replay waits for electron-postman window registration', async () => {
  const source = (path) => fileURLToPath(new URL(path, import.meta.url))
  const contents = new Map()
  const postman = loadTypescript(
    source('../../../../packages/electron-postman/src/ipcMain.js'),
    {
      electron: {
        ipcMain: new EventEmitter(),
        webContents: { fromId: (id) => contents.get(id) },
      },
      './utils': loadTypescript(
        source('../../../../packages/electron-postman/src/utils.js'),
      ),
    },
  )
  const sent = []
  const f = fixture({
    onResize: (size) =>
      postman.sendTo('messenger-game-overlay', 'resize', size),
  })
  await f.overlay.start()
  f.event('graphics.window', { width: 1280, height: 720 })
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  window.webContents.id = 1
  window.webContents.send = (channel, ...args) => sent.push({ channel, args })
  contents.set(1, window.webContents)
  postman.registerBrowserWindow('messenger-game-overlay', window)
  assert.doesNotThrow(() => window.finishLoad())
  await Promise.resolve()
  assert.equal(
    sent.filter(({ channel }) => channel.endsWith('-resize')).length,
    1,
  )
  window.destroy()
})

test('disable cancels delayed mouse focus work after an accepted intercept', async () => {
  let releasePosition
  const f = fixture({
    getMousePosition: () =>
      new Promise((resolve) => {
        releasePosition = resolve
      }),
  })
  await f.overlay.start()
  f.store.enableGameOverlay = true
  f.loadedRenderer()
  f.overlay.startIntercept()
  f.event('game.input.intercept', { pid: 123, intercepting: true })
  assert.equal(f.overlay.intercepting, true)
  assert.equal(f.focuses(), 1)
  f.store.enableGameOverlay = false
  f.overlay.stopIntercept()
  releasePosition({ x: 100, y: 100 })
  await new Promise(setImmediate)
  assert.equal(f.moves.length, 0)
  assert.equal(f.clicks(), 0)
})

test('disable during a pending mouse move skips clicking and restores the cursor', async () => {
  let releaseMove
  const initialPosition = { x: 100, y: 100 }
  const f = fixture({
    getMousePosition: async () => initialPosition,
    setMousePosition: (position) =>
      position === initialPosition
        ? Promise.resolve()
        : new Promise((resolve) => {
            releaseMove = resolve
          }),
  })
  await f.overlay.start()
  f.store.enableGameOverlay = true
  f.loadedRenderer()
  f.overlay.startIntercept()
  f.event('game.input.intercept', { pid: 123, intercepting: true })
  await new Promise(setImmediate)
  assert.equal(f.moves.length, 1)
  f.store.enableGameOverlay = false
  f.overlay.stopIntercept()
  releaseMove()
  await new Promise(setImmediate)
  assert.equal(f.clicks(), 0)
  assert.equal(f.moves.length, 2)
  assert.equal(f.moves[1], initialPosition)
})

test('native resize events do not send IPC to an absent optional renderer', async () => {
  const f = fixture()
  await f.overlay.start()
  f.event('graphics.window', { width: 1920, height: 1080 })
  assert.equal(f.resizes(), 0)
})

test('hooked games use the desktop messenger while their optional renderer is absent', () => {
  const f = fixture()
  f.overlay.hookedProcesses[123] = true
  assert.equal(f.overlay.isProcessHooked(123), false)
})

test('only a live loaded renderer receives native resizing and is considered hooked', async () => {
  const f = fixture()
  await f.overlay.start()
  f.overlay.hookedProcesses[123] = true
  let loading = true
  let destroyed = false
  f.renderer({
    isDestroyed: () => destroyed,
    webContents: { isLoadingMainFrame: () => loading },
  })
  f.event('graphics.window', { width: 1920, height: 1080 })
  assert.equal(f.resizes(), 0)
  assert.equal(f.overlay.isProcessHooked(123), false)
  loading = false
  f.event('graphics.window', { width: 1920, height: 1080 })
  assert.equal(f.resizes(), 1)
  assert.equal(f.overlay.isProcessHooked(123), true)
  destroyed = true
  f.event('graphics.window', { width: 1920, height: 1080 })
  assert.equal(f.resizes(), 1)
  assert.equal(f.overlay.isProcessHooked(123), false)
})
