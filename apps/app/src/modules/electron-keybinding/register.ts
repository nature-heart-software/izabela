import { app } from 'electron'
import store from '@/store'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from '@/utils/vue'
import iohook from '@/modules/node-iohook'

export default () =>
  app.whenReady().then(() =>
    store.getters.isReady().then(() => {
      const multiKeysKeybindings: Record<string, number | null> = {}
      const setToggleMessengerWindowKeybinding = () => {
        const keybinding =
          store.getters['settings/persisted'].multiKeysKeybindings.toggleMessengerWindow
        if (multiKeysKeybindings.toggleMessengerWindow) {
          iohook.unregisterShortcut(multiKeysKeybindings.toggleMessengerWindow)
          multiKeysKeybindings.toggleMessengerWindow = null
        }
        if (keybinding) {
          multiKeysKeybindings.toggleMessengerWindow = iohook.registerShortcut(
            keybinding.combination,
            () => {
              console.log('keybindings: toggleMessengerWindow')
              electronMessengerWindow.toggleWindow()
            },
          )
        }
      }
      watch(
        () => store.getters['settings/persisted'].multiKeysKeybindings.toggleMessengerWindow,
        () => {
          console.log(
            'Changing keybinding for toggleMessengerWindow',
            store.getters['settings/persisted'].multiKeysKeybindings.toggleMessengerWindow,
          )
          setToggleMessengerWindowKeybinding()
        },
      )
      setToggleMessengerWindowKeybinding()
    }),
  )
