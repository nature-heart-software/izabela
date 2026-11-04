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
  let paint = Promise.resolve(true)
  let paintRequests = 0
  let timerId = 0
  const timers = new Map()
  Object.assign(window, {
    isVisible: () => visible,
    isDestroyed: () => destroyed,
    show() {
      visible = true
    },
    hide() {
      visible = false
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
        return paint
      },
    },
  })
  const { ElectronMessengerWindow } = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      '@/modules/electron-window-manager': {
        getInstanceByName: () => ({ window }),
      },
      '@/modules/node-mouse': {},
      electron: {},
      '@/teams/messenger/store': {},
      '@/features/settings/store': {},
      '@/modules/vue-hitboxes/hitboxes.store': {},
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
      '@/features/display/utils': {},
    },
    {
      setTimeout: (fn) => {
        const id = ++timerId
        timers.set(id, fn)
        return id
      },
      clearTimeout: (id) => timers.delete(id),
    },
  )
  return {
    controller: ElectronMessengerWindow(),
    flush: () => {
      const callbacks = [...timers.values()]
      timers.clear()
      callbacks.forEach((fn) => fn())
    },
    visible: () => visible,
    paintRequests: () => paintRequests,
    deferPaint: () => {
      let finish
      paint = new Promise((resolve) => {
        finish = resolve
      })
      return () => finish(true)
    },
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

test('hides only after the renderer has painted a transparent backdrop', async () => {
  const f = fixture()
  f.controller.focus('keyboard')
  const finishPaint = f.deferPaint()
  const hiding = f.controller.hide()
  await Promise.resolve()
  assert.equal(f.visible(), true)
  assert.equal(f.paintRequests(), 1)
  finishPaint()
  await hiding
  assert.equal(f.visible(), false)
})

test('a shortcut during pending hide reopens instead of hiding the new activation', async () => {
  const f = fixture()
  f.controller.focus('keyboard')
  const finishPaint = f.deferPaint()
  const hiding = f.controller.hide()
  await Promise.resolve()
  f.controller.toggleWindow('keyboard')
  finishPaint()
  await hiding
  assert.equal(f.visible(), true)
})

test('an unresponsive renderer cannot prevent the native window from hiding', async () => {
  const f = fixture()
  f.controller.focus('keyboard')
  f.deferPaint()
  const hiding = f.controller.hide()
  await Promise.resolve()
  f.flush()
  await hiding
  assert.equal(f.visible(), false)
})
