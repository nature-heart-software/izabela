import assert from 'node:assert/strict'
import test from 'node:test'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'

const primaryDisplay = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  scaleFactor: 1,
}
const secondaryDisplay = {
  id: 2,
  bounds: { x: 1920, y: 0, width: 1280, height: 1024 },
  scaleFactor: 1,
}

function fixture({
  displays = [primaryDisplay, secondaryDisplay],
  screenToDipPoint = (point) => point,
} = {}) {
  const window = new EventEmitter()
  let bounds = { ...displays[0].bounds }
  let focused = false
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
    getPosition: () => [bounds.x, bounds.y],
    getBounds: () => ({ ...bounds }),
    setBounds(nextBounds) {
      bounds = { ...nextBounds }
    },
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
      focused = true
      window.emit('focus')
    },
    blur() {
      focused = false
      window.emit('blur')
    },
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
          screenToDipPoint,
          getDisplayNearestPoint: ({ x, y }) =>
            displays.find(
              ({ bounds: b }) =>
                x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height,
            ),
          getDisplayMatching: ({ x, y }) =>
            displays.find(({ bounds: b }) => b.x === x && b.y === y),
          getAllDisplays: () => displays,
          getPrimaryDisplay: () => displays[0],
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
    click: (x, y) => mouse?.('left-down', x, y),
    settings,
    focused: () => focused,
    moveWindow: (display) => window.setBounds(display.bounds),
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

test('mouse movement on another display preserves keyboard focus', async () => {
  const f = fixture()
  await f.start()
  f.controller.focus('keyboard')
  assert.equal(f.focused(), true)
  f.move(2000, 200)
  assert.equal(f.focused(), true)
  assert.equal(f.visible(), true)
})

for (const [name, bounds, point] of [
  ['left', { x: -1280, y: 0, width: 1280, height: 1024 }, [-100, 200]],
  ['above', { x: 0, y: -1024, width: 1280, height: 1024 }, [200, -100]],
]) {
  test(`movement on a display ${name} of Izabela preserves focus`, async () => {
    const f = fixture({
      displays: [primaryDisplay, { ...secondaryDisplay, bounds }],
    })
    await f.start()
    f.controller.focus('keyboard')
    f.move(...point)
    assert.equal(f.focused(), true)
  })
}

test('same-display movement still blurs outside controls and focuses inside', async () => {
  const f = fixture()
  await f.start()
  f.controller.focus('keyboard')
  f.move(200, 200)
  assert.equal(f.focused(), false)
  f.move(50, 50)
  assert.equal(f.focused(), true)
})

test('another display cannot acquire focus for an already blurred messenger', async () => {
  const f = fixture()
  await f.start()
  f.controller.focus('keyboard')
  await f.controller.blur()
  f.move(2000, 200)
  assert.equal(f.focused(), false)
})

test('movement follows the current window display after relocation', async () => {
  const f = fixture()
  await f.start()
  f.moveWindow(secondaryDisplay)
  f.controller.focus('keyboard')
  f.move(200, 200)
  assert.equal(f.focused(), true)
  f.move(2200, 200)
  assert.equal(f.focused(), false)
  f.move(1970, 50)
  assert.equal(f.focused(), true)
})

test('mixed-DPI display selection uses converted mouse coordinates', async () => {
  const f = fixture({
    displays: [{ ...primaryDisplay, scaleFactor: 1.5 }, secondaryDisplay],
    screenToDipPoint: ({ x, y }) =>
      x < 2880 ? { x: x / 1.5, y: y / 1.5 } : { x: 1920 + x - 2880, y },
  })
  await f.start()
  f.controller.focus('keyboard')
  f.move(3000, 200)
  assert.equal(f.focused(), true)
  // Raw x=2100 would select the other display without DIP conversion.
  f.move(2100, 300)
  assert.equal(f.focused(), false)
  f.move(75, 75)
  assert.equal(f.focused(), true)
})

test('outside clicks on another display still honor hide-on-click-outside', async () => {
  const f = fixture()
  await f.start()
  f.settings.hideWindowOnClickOutside = true
  f.controller.focus('keyboard')
  f.click(2000, 200)
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(f.focused(), false)
  assert.equal(f.visible(), false)
})
