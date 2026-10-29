import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'

function fixture() {
  const keys = new Set(),
    timers = new Map(),
    blocks = [],
    commands = []
  let released = true,
    nextTimer = 0
  const settings = {
    enableOverlayWindow: true,
    keybindings: { toggleOverlayWindow: [] },
    $whenReady: async () => {},
  }
  const state = {
    isShown: false,
    $patch(value) {
      Object.assign(this, value)
    },
  }
  const gkl = {
    addListener: (fn) => keys.add(fn),
    removeListener: (fn) => keys.delete(fn),
  }
  const controller = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      '@/modules/electron-window-manager': {
        getInstanceByName: () => undefined,
      },
      electron: {
        screen: {
          getAllDisplays: () => [],
          getPrimaryDisplay: () => ({ bounds: {} }),
        },
      },
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/modules/electron-keybinding/utils': {
        gkl,
        keybindingAllReleased: () => released,
        keybindingTriggered: () => false,
      },
      '@/electron/events/main': {
        emitIPCOverlayInputCharacter: (c) => commands.push(c),
        emitIPCOverlayInputCommand: (c) => commands.push(c),
      },
      '@packages/native-keymap': { getKeyMap: () => ({}) },
      '@/teams/messenger/modules/electron-messenger-window': {
        hide: async () => true,
      },
      '@/teams/overlay/store': { useOverlayWindowStore: () => state },
      koffi: { load: () => ({ func: () => (value) => blocks.push(value) }) },
      '@/features/display/utils': { findDisplay: () => undefined },
    },
    {
      setTimeout: (fn) => {
        timers.set(++nextTimer, fn)
        return nextTimer
      },
      clearTimeout: (id) => timers.delete(id),
    },
  ).default
  const makeWindow = () => {
    const w = Object.assign(new EventEmitter(), {
      destroyed: false,
      visible: false,
      webContents: { zoomLevel: 0 },
      isDestroyed() {
        return this.destroyed
      },
      isVisible() {
        return this.visible
      },
      hide() {
        this.visible = false
        this.emit('hide')
      },
      showInactive() {
        this.visible = true
        this.emit('show')
      },
      setBounds() {},
      destroy() {
        this.destroyed = true
        this.emit('closed')
      },
    })
    return w
  }
  return {
    controller,
    settings,
    state,
    keys,
    blocks,
    makeWindow,
    commands,
    release() {
      released = true
      ;[...keys].forEach((fn) => fn({ state: 'UP' }, {}))
    },
    hold() {
      released = false
    },
    flush() {
      const work = [...timers.values()]
      timers.clear()
      work.forEach((fn) => fn())
    },
  }
}

test('absent overlay controls never fall back to the messenger or block input', async () => {
  const f = fixture()
  assert.equal(await f.controller.show(), false)
  assert.equal(await f.controller.hide(), false)
  f.controller.setDisplay()
  f.flush()
  assert.equal(f.blocks.includes(1), false)
})
test('disabling during shortcut release cancels a pending show', async () => {
  const f = fixture(),
    w = f.makeWindow()
  f.controller.start(w)
  f.hold()
  const showing = f.controller.show()
  f.settings.enableOverlayWindow = false
  await f.controller.hide()
  w.destroy()
  f.release()
  f.flush()
  assert.equal(await showing, false)
  assert.equal(w.visible, false)
  assert.equal(f.blocks.includes(1), false)
  assert.equal(f.keys.size, 0)
})
test('closing before the delayed block cancels it and replacement shortcuts work', async () => {
  const f = fixture(),
    w = f.makeWindow()
  f.controller.start(w)
  assert.equal(await f.controller.show(), true)
  w.destroy()
  f.flush()
  assert.equal(f.blocks.includes(1), false)
  assert.equal(f.keys.size, 0)
  const replacement = f.makeWindow()
  f.controller.start(replacement)
  assert.equal(await f.controller.isReady(), replacement)
  assert.equal(await f.controller.show(), true)
  f.flush()
  assert.equal(f.blocks.at(-1), 1)
  await f.controller.hide()
  assert.equal(f.blocks.at(-1), 0)
  assert.equal(f.state.isShown, false)
  replacement.destroy()
  assert.equal(f.keys.size, 0)
})
