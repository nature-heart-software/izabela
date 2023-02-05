import nativeKeymap from '@packages/native-keymap'
import { Key } from '@/types/keybinds'
import {
  GlobalKeyboardListener,
  IGlobalKeyDownMap,
  IGlobalKeyEvent,
} from 'node-global-key-listener'
import { find } from 'lodash'

export const registeredEvents: Partial<Record<Required<IGlobalKeyEvent>['name'], {
  event: IGlobalKeyEvent,
  nativeKey: Key & { code: string }
}>> = {}

export const keyCodeMap: any = {
  ControlRight: "VK_RCONTROL",
  ControlLeft: "VK_LCONTROL",
  ShiftRight: "VK_RSHIFT",
  ShiftLeft: "VK_LSHIFT",
  AltRight: "VK_RMENU",
  AltLeft: "VK_LMENU",
  MetaRight: "VK_RWIN",
  MetaLeft: "VK_LWIN",
}

const keymapByVKey = Object.fromEntries(Object.entries(nativeKeymap.getKeyMap()).map(([code, value]) => ([keyCodeMap[code] || (value as any).vkey, {
    ...value,
    code,
    vkey: keyCodeMap[code] || (value as any).vkey,
  }]),
))

const gkl = new GlobalKeyboardListener()
gkl.addListener((e) => {
  if (e.state === 'DOWN') {
    if (e.name) registeredEvents[e.name] = {
      event: e,
      // eslint-disable-next-line no-underscore-dangle
      nativeKey: keymapByVKey[e.rawKey._nameRaw],
    }
  }
})

export const keybindingTriggered = (keybinding: Key[], downKeys: IGlobalKeyDownMap) => {
  const downNames = Object.entries(downKeys).map(([name, value]) => value ? name : null).filter(Boolean) as string[]
  return keybinding.map((key) => {
    const registeredEvent = find(registeredEvents, (t) => !!t?.nativeKey.code.includes(key.code))
    return downNames.includes(registeredEvent?.event.name || '')
  }).every(Boolean)
}
