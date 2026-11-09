import assert from 'node:assert/strict'
import test from 'node:test'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'

function fixture() {
  const window = new EventEmitter()
  let visible = false
  let destroyed = false
  let nativeFocuses = 0
  let paintRequests = 0
  let mouse
  const timers = []
  const store = { $patch() {} }
  const settings = {
    $whenReady: () => Promise.resolve(),
    hideWindowOnClickOutside: false,
  }
  Object.assign(window, {
    isVisible: () => visible,
    isDestroyed: () => destroyed,
    getPosition: () => [0, 0],
    setBounds() {},
    show() {
      const wasVisible = visible
      visible = true
      if (!wasVisible) window.emit('show')
    },
    hide() {
      visible = false
      window.emit('hide')
    },
    focus() {
      window.emit('focus')
    },
    blur() {},
    setFocusable() {},
    setIgnoreMouseEvents() {},
    webContents: {
      executeJavaScript() {
        paintRequests++
        throw new Error('Window hiding must not depend on renderer paint')
      },
      setWindowOpenHandler() {},
    },
  })
  const { ElectronMessengerWindow } = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      '@/modules/electron-window-manager': {
        getInstanceByName: () => ({ window }),
      },
      '@/modules/node-mouse': {
        startMouse: (_event, callback) => {
          mouse = callback
          return 'test-mouse'
        },
        stopMouse: () => {
          mouse = undefined
        },
      },
      electron: {
        screen: {
          screenToDipPoint: (point) => point,
          getDisplayNearestPoint: () => ({ scaleFactor: 1 }),
          getAllDisplays: () => [],
          getPrimaryDisplay: () => ({ bounds: {} }),
        },
      },
      '@/teams/messenger/store': { useMessengerWindowStore: () => store },
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/modules/vue-hitboxes/hitboxes.store': {
        useHitboxesStore: () => ({
          hitboxes: [{ x: 0, y: 0, w: 100, h: 100 }],
        }),
      },
      '@packages/toolbox': {
        Deferred() {
          let resolve
          const promise = new Promise((done) => {
            resolve = done
          })
          return { promise, resolve }
        },
      },
      '@/utils/electron-window': { getNativeWindowHandleInt: () => 1 },
      '@/electron/game-overlay.ts': { isProcessHooked: () => false },
      forcefocus: {
        focusWindow: () => {
          nativeFocuses++
        },
      },
      koffi: { load: () => ({ func: () => () => 2 }) },
      '@/modules/electron-dialog': { dialogsMap: new Map() },
      '@/features/display/utils': { findDisplay: () => undefined },
      'win-control': {
        Window: { getForeground: () => ({ getPid: () => 42 }) },
      },
    },
    { setTimeout: (fn) => timers.push(fn) },
  )
  const controller = ElectronMessengerWindow()
  return {
    controller,
    start: async () => {
      controller.start(window)
      await Promise.resolve()
      await Promise.resolve()
    },
    close: () => {
      let prevented = false
      window.emit('close', {
        preventDefault() {
          prevented = true
        },
      })
      assert.equal(prevented, true)
    },
    move: (x, y) => mouse?.('move', x, y),
    visible: () => visible,
    paintRequests: () => paintRequests,
    flush: () => timers.splice(0).forEach((fn) => fn()),
    nativeFocuses: () => nativeFocuses,
    destroy: () => {
      destroyed = true
    },
  }
}

test('quick Escape/send cannot let delayed native focus steal focus after hiding', async () => {
  const f = fixture()
  f.controller.focus('keyboard', true)
  await f.controller.hide()
  f.flush()
  assert.equal(f.nativeFocuses(), 0)
})

test('native focus workaround still runs for a visible focused messenger', () => {
  const f = fixture()
  f.controller.focus('keyboard', true)
  f.flush()
  assert.equal(f.nativeFocuses(), 1)
})

test('destroying the messenger also invalidates delayed native focus', () => {
  const f = fixture()
  f.controller.focus('keyboard', true)
  f.destroy()
  f.flush()
  assert.equal(f.nativeFocuses(), 0)
})

test('native close still hides after inside-to-outside mouse motion without waiting for renderer paint', async () => {
  const f = fixture()
  await f.start()
  f.controller.focus('keyboard')
  f.close()
  f.move(50, 50)
  f.move(200, 200)
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(f.visible(), false)
  assert.equal(f.paintRequests(), 0)
})

test('an explicit show reopens the window after hide completes', async () => {
  const f = fixture()
  await f.start()
  f.controller.focus('keyboard')
  await f.controller.hide()
  assert.equal(f.visible(), false)
  assert.equal(f.paintRequests(), 0)
  await f.controller.show()
  assert.equal(f.visible(), true)
})
