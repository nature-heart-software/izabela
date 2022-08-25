import keymap from 'native-keymap';

export const ElectronKeybinding = () => ({
  getKeyMap: () => Promise.resolve(keymap.getKeyMap()),
  getCurrentKeyboardLayout: () => Promise.resolve(keymap.getCurrentKeyboardLayout()),
  isISOKeyboard: () => Promise.resolve(keymap.isISOKeyboard()),
})

export default ElectronKeybinding()
