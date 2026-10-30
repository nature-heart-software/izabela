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
  const timers = []
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
      '@/electron/game-overlay-backend': { isProcessHooked: () => false },
      forcefocus: {
        focusWindow: () => {
          nativeFocuses++
        },
      },
      koffi: { load: () => ({ func: () => () => 2 }) },
      '@/modules/electron-dialog': { dialogsMap: new Map() },
      '@/features/display/utils': {},
    },
    { setTimeout: (fn) => timers.push(fn) },
  )
  return {
    controller: ElectronMessengerWindow(),
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
