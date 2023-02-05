import nativeKeymap from '@packages/native-keymap'
import { Key } from '@/types/keybinds'
import {
  GlobalKeyboardListener,
  IGlobalKeyDownMap,
  IGlobalKeyEvent,
} from 'node-global-key-listener'
import { find } from 'lodash'

export const gkl = new GlobalKeyboardListener()

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

// map by vKey instead of code to match native-keymap and gkl + fix vkey from native-keymap
const keymapByVKey = Object.fromEntries(
  Object.entries(nativeKeymap.getKeyMap()).map(([code, value]) => [
    keyCodeMap[code] || (value as any).vkey,
    {
      ...value,
      code,
      // fixes vkey where ShiftLeft in native-keymap is VK_SHIFT but in gkl it's Vk_LSHIFT, etc.
      vkey: keyCodeMap[code] || (value as any).vkey,
    },
  ]),
)

// gkl uses its events name to map the downMap but it's impossible to remap them any other way
// so we save them with more infos for later use
gkl.addListener((e) => {
  if (e.state === 'DOWN') {
    if (e.name)
      registeredEvents[e.name] = {
        event: e,
        // eslint-disable-next-line no-underscore-dangle
        nativeKey: keymapByVKey[e.rawKey._nameRaw],
      }
  }
})

const getDownNames = (downKeys: IGlobalKeyDownMap) =>
  Object.entries(downKeys)
    .map(([name, value]) => (value ? name : null))
    .filter(Boolean) as string[]

export const keybindingTriggered = (keybinding: Key[], down: IGlobalKeyDownMap) => {
  const downNames = getDownNames(down)
  return keybinding
    .map((key) => {
      const registeredEvent = find(registeredEvents, (t) => !!t?.nativeKey.code.includes(key.code))
      return downNames.includes(registeredEvent?.event.name || '')
    })
    .every(Boolean)
}
