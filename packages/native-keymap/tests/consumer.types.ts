import {
  getKeyMap,
  getCurrentKeyboardLayout,
  onDidChangeKeyboardLayout,
  isISOKeyboard,
} from '..'
import type {
  IKeyboardMapping,
  IKeyboardLayoutInfo,
  IWindowsKeyboardMapping,
  ILinuxKeyboardMapping,
  IMacKeyboardMapping,
} from '..'

const mapping: IKeyboardMapping | [] = getKeyMap()
const layout: IKeyboardLayoutInfo | null = getCurrentKeyboardLayout()
const iso: boolean | undefined = isISOKeyboard()
const subscription: void = onDidChangeKeyboardLayout(() => {})
const windows: IWindowsKeyboardMapping = {
  KeyA: {
    vkey: 'VK_A',
    value: 'a',
    withShift: 'A',
    withAltGr: '',
    withShiftAltGr: '',
  },
}
const linux: ILinuxKeyboardMapping = {
  KeyA: { value: 'a', withShift: 'A', withAltGr: '', withShiftAltGr: '' },
}
const mac: IMacKeyboardMapping = {
  KeyA: {
    value: 'a',
    valueIsDeadKey: false,
    withShift: 'A',
    withShiftIsDeadKey: false,
    withAltGr: '',
    withAltGrIsDeadKey: false,
    withShiftAltGr: '',
    withShiftAltGrIsDeadKey: false,
  },
}
if (layout && 'layout' in layout) {
  const group: number = layout.group
  void group
}
if (!Array.isArray(mapping)) {
  const value: string = mapping.KeyA.value
  void value
}
// @ts-expect-error Layout retrieval can fail and return null.
const alwaysLayout: IKeyboardLayoutInfo = getCurrentKeyboardLayout()
// @ts-expect-error Mapping retrieval can fail and return an empty array.
const alwaysMap: IKeyboardMapping = getKeyMap()
// @ts-expect-error The subscription has no disposal handle.
subscription.dispose()
// @ts-expect-error A native layout callback is required.
onDidChangeKeyboardLayout('change')
// @ts-expect-error Getters take no configuration.
getKeyMap({ layout: 'us' })
// @ts-expect-error Avoid accidental any on getter result.
const number: number = getKeyMap()
const invalidMac: IMacKeyboardMapping = {
  // @ts-expect-error Dead-key flags are boolean.
  KeyA: { ...mac.KeyA, valueIsDeadKey: 'false' },
}
void [
  mapping,
  layout,
  iso,
  subscription,
  windows,
  linux,
  mac,
  alwaysLayout,
  alwaysMap,
  number,
  invalidMac,
]
