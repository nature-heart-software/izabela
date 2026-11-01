import keymap from '@packages/native-keymap'
import clipboard from 'clipboardy'

export const ElectronKeybinding = () => ({
  getKeyMap: () => Promise.resolve(keymap.getKeyMap()),
  getCurrentKeyboardLayout: () => Promise.resolve(keymap.getCurrentKeyboardLayout()),
  isISOKeyboard: () => Promise.resolve(keymap.isISOKeyboard()),
  copyToClipboard: (text: string) => {
    clipboard.writeSync(text)
    Promise.resolve(true)
  },
  readFromClipboard: () => Promise.resolve(clipboard.readSync()),
})

export default ElectronKeybinding()
