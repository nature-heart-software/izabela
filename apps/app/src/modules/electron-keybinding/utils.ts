import nativeKeymap from '@packages/native-keymap'
import { Key } from '@/types/keybinds'
import {
  GlobalKeyboardListener,
  IGlobalKeyEvent,
} from 'node-global-key-listener'
import entries from 'lodash/entries'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'

export const gkl =
  typeof window === 'undefined' ? new GlobalKeyboardListener() : undefined

export const down: Partial<
  Record<IGlobalKeyEvent['rawKey']['_nameRaw'], boolean>
> = {}

// Makes sure down is reset when a shortcut is triggered
export const handleShortcut = <C extends (...args: any[]) => void>(c: C) => {
  Object.keys(down).forEach((key) => {
    delete down[key]
  })
  return (...args: any[]) => c(...args)
}

export const registeredEvents: Partial<
  Record<
    Required<IGlobalKeyEvent>['name'],
    {
      event: IGlobalKeyEvent
      nativeKey: Key & { code: string }
    }
  >
> = {}

export const keyCodeMap: any = {
  ControlRight: 'VK_RCONTROL',
  ControlLeft: 'VK_LCONTROL',
  ShiftRight: 'VK_RSHIFT',
  ShiftLeft: 'VK_LSHIFT',
  AltRight: 'VK_RMENU',
  AltLeft: 'VK_LMENU',
  MetaRight: 'VK_RWIN',
  MetaLeft: 'VK_LWIN',
}

const keymap = keyBy(
  map(nativeKeymap.getKeyMap(), (value, key) => ({
    ...value,
    code: key,
    vkey: keyCodeMap[key] || ('vkey' in value ? value.vkey : undefined),
  })),
  (value) => value.code,
)

// map by vKey instead of code to match native-keymap and gkl + fix vkey from native-keymap
const keymapByVKey = Object.fromEntries(
  entries(nativeKeymap.getKeyMap()).map(([code, value]) => [
    keyCodeMap[code] ||
      ('vkey' in value
        ? (value as typeof value & { vkey: string }).vkey
        : undefined),
    {
      ...value,
      code,
      // fixes vkey where ShiftLeft in native-keymap is VK_SHIFT but in gkl it's Vk_LSHIFT, etc.
      vkey:
        keyCodeMap[code] ||
        ('vkey' in value
          ? (value as typeof value & { vkey: string }).vkey
          : undefined),
    },
  ]),
)

// gkl uses its events name to map the downMap but it's impossible to remap them any other way
// so we save them with more infos for later use
gkl?.addListener((e) => {
  if (e.state === 'DOWN') {
    // eslint-disable-next-line no-underscore-dangle
    down[e.rawKey._nameRaw] = true
    if (e.name)
      registeredEvents[e.name] = {
        event: e,
        // eslint-disable-next-line no-underscore-dangle
        nativeKey: keymapByVKey[e.rawKey._nameRaw],
      }
  } else if (e.state === 'UP') {
    // eslint-disable-next-line no-underscore-dangle
    delete down[e.rawKey._nameRaw]
  }
})

export const keybindingTriggered = (keybinding: Key[]) => {
  if (!keybinding.length) return false
  return keybinding
    .map(
      (key) =>
        keymap[key.code as keyof typeof keymap]?.vkey &&
        down[keymap[key.code as keyof typeof keymap]?.vkey],
    )
    .every(Boolean)
}

export const keybindingReleased = (keybinding: Key[]) => {
  if (!keybinding.length) return false
  return keybinding
    .map(
      (key) =>
        keymap[key.code as keyof typeof keymap]?.vkey &&
        down[keymap[key.code as keyof typeof keymap]?.vkey],
    )
    .some((v) => !v)
}

export const keybindingAllReleased = (keybinding: Key[]) => {
  if (!keybinding.length) return true
  return keybinding
    .map(
      (key) =>
        keymap[key.code as keyof typeof keymap]?.vkey &&
        !down[keymap[key.code as keyof typeof keymap]?.vkey],
    )
    .every(Boolean)
}
