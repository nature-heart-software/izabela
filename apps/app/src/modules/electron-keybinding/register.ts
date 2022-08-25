import { app, globalShortcut } from 'electron'
import store from '@/store'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from '@/utils/vue'

export default () =>
  app.whenReady().then(() =>
    store.getters.isReady().then(() => {
      const multiKeysKeybindings = {
        toggleMessengerWindow: () => electronMessengerWindow.toggleWindow(),
      }
      const registeredShortcuts: Record<string, string> = {}

      const unregisterAllShortcuts = () => {
        Object.keys(registeredShortcuts).forEach((key) => {
          globalShortcut.unregister(registeredShortcuts[key])
          delete registeredShortcuts[key]
        })
      }
      const setToggleMessengerWindowKeybinding = () => {
        console.log('Registering keybindings', store.getters['settings/persisted'].multiKeysKeybindings.toggleMessengerWindow)
        globalShortcut.register(store.getters['settings/persisted'].multiKeysKeybindings.toggleMessengerWindow, multiKeysKeybindings.toggleMessengerWindow)
        registeredShortcuts.toggleMessengerWindow = store.getters['settings/persisted'].multiKeysKeybindings.toggleMessengerWindow
      }

      watch(() => [store.getters['settings/persisted'].multiKeysKeybindings.toggleMessengerWindow], () => {
        console.log('Changing keybinding', store.getters['settings/persisted'].multiKeysKeybindings.toggleMessengerWindow)
        unregisterAllShortcuts()
        setToggleMessengerWindowKeybinding()
      }, { deep: true })

      setToggleMessengerWindowKeybinding()
    }),
  )
