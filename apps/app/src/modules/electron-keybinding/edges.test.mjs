import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

function fixture() {
  const listeners = new Set()
  const keymap = {
    KeyQ: { vkey: 'VK_A', value: 'a' }, // AZERTY physical Q produces A.
    KeyE: { vkey: 'VK_E', value: 'e', withAltGr: '€' },
    ControlLeft: {},
    AltRight: {},
    ShiftRight: {},
  }
  const api = loadTypescript(
    fileURLToPath(new URL('./utils.ts', import.meta.url)),
    {
      '@packages/native-keymap': { getKeyMap: () => keymap },
      'node-global-key-listener': {
        GlobalKeyboardListener: class {
          addListener(fn) {
            listeners.add(fn)
          }
        },
      },
    },
  )
  return {
    api,
    keys: (...codes) => codes.map((code) => ({ code, key: code })),
    add: (fn) => listeners.add(fn),
    emit(raw, state = 'DOWN') {
      for (const fn of listeners)
        fn({ rawKey: { _nameRaw: raw }, name: raw, state })
    },
  }
}
test('AZERTY and AltGr chords use physical codes and distinguish left/right modifiers', () => {
  const f = fixture(),
    keys = f.keys('AltRight', 'KeyE')
  f.emit('VK_LMENU')
  f.emit('VK_E')
  assert.equal(f.api.keybindingTriggered(keys), false)
  f.emit('VK_LMENU', 'UP')
  f.emit('VK_RMENU')
  assert.equal(f.api.keybindingTriggered(keys), true)
  f.emit('VK_RMENU', 'UP')
  assert.equal(f.api.keybindingReleased(keys), true)
  f.emit('VK_E', 'UP')
  f.emit('VK_A')
  assert.equal(f.api.keybindingTriggered(f.keys('KeyQ')), true)
  assert.equal(f.api.keybindingAllReleased(keys), true)
})
test('autorepeat fires once, focus changes do not discard held keys, and release rearms', () => {
  const f = fixture(),
    keys = f.keys('ControlLeft', 'KeyQ')
  let calls = 0
  f.add(f.api.createShortcutListener(keys, () => calls++))
  f.emit('VK_LCONTROL')
  f.emit('VK_A')
  for (let n = 0; n < 30; n++) f.emit('VK_A')
  assert.equal(calls, 1)
  // Building/rebinding an unrelated shortcut must not erase push-to-record state.
  f.api.handleShortcut(() => {})()
  assert.equal(f.api.keybindingTriggered(keys), true)
  f.emit('VK_A', 'UP')
  f.emit('VK_A')
  assert.equal(calls, 2)
  f.emit('VK_A', 'UP')
  f.emit('VK_LCONTROL', 'UP')
  assert.equal(f.api.keybindingAllReleased(keys), true)
})
test('rebinding a held chord waits for release instead of treating repeat as a new press', () => {
  const f = fixture(),
    keys = f.keys('ControlLeft', 'KeyQ')
  f.emit('VK_LCONTROL')
  f.emit('VK_A')
  let calls = 0
  f.add(f.api.createShortcutListener(keys, () => calls++))
  f.emit('VK_A')
  assert.equal(calls, 0)
  f.emit('VK_A', 'UP')
  f.emit('VK_A')
  assert.equal(calls, 1)
})

test('conflicting saved phrase/profile chords leave no listeners behind after rebind', async () => {
  const f = fixture(),
    watches = [],
    listeners = new Set(),
    sent = []
  const chord = f.keys('AltRight', 'KeyE')
  const bindings = Object.fromEntries(
    [
      'toggleMessengerWindow',
      'toggleMessengerWindowAlt',
      'toggleOverlayWindow',
      'cancelCurrentMessage',
      'cancelAllMessages',
    ].map((key) => [key, []]),
  )
  const messages = {
    shortcutMessages: [
      { shortcut: chord, message: 'phrase 1' },
      { shortcut: chord, message: 'phrase 2' },
    ],
  }
  const profiles = { profiles: [{ id: 'conflict', shortcut: chord }] }
  const register = loadTypescript(
    fileURLToPath(new URL('./register.ts', import.meta.url)),
    {
      electron: {
        app: { whenReady: async () => {} },
        globalShortcut: { register() {}, unregister() {} },
      },
      vue: { watch: (source, cb) => watches.push(cb) },
      '@/features/settings/store': {
        useSettingsStore: () => ({ keybindings: bindings }),
      },
      '@/features/messages/store': { useMessagesStore: () => messages },
      '@/features/profiles/store.ts': { useProfilesStore: () => profiles },
      '@/teams/messenger/modules/electron-messenger-window': {},
      '@/teams/overlay/modules/electron-overlay-window': {},
      '@/modules/electron-keybinding/utils': {
        ...f.api,
        gkl: {
          addListener: (fn) => listeners.add(fn),
          removeListener: (fn) => listeners.delete(fn),
        },
      },
      'lodash/debounce': (fn) => fn,
      'electron-postman': { ipcMain: { sendTo: (...args) => sent.push(args) } },
      '@packages/toolbox': { purify: (value) => value },
      '@/electron/events/main': { emitIPCApplyProfile() {} },
    },
    { console: { log() {} } },
  ).default
  await register()
  const before = listeners.size
  for (let n = 0; n < 10; n++) watches[0]()
  assert.equal(listeners.size, before)
  messages.shortcutMessages = []
  profiles.profiles = []
  watches[0]()
  assert.equal(listeners.size, before - 3)
})
