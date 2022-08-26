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
        const keybinding = store.getters['settings/persisted'].keybindings.toggleMessengerWindow.map(({key}: any) => key).join('+')
        console.log('Registering keybindings', keybinding)
        const registered = globalShortcut.register(
          store.getters['settings/persisted'].keybindings.toggleMessengerWindow.map(({key}: any) => key).join('+'),
          multiKeysKeybindings.toggleMessengerWindow
        )
        console.log({ registered })
        registeredShortcuts.toggleMessengerWindow = store.getters['settings/persisted'].keybindings.toggleMessengerWindow
      }
      setToggleMessengerWindowKeybinding()

      watch(() => [store.getters['settings/persisted'].keybindings.toggleMessengerWindow], () => {
        console.log('Changing keybinding', store.getters['settings/persisted'].keybindings.toggleMessengerWindow)
        unregisterAllShortcuts()
        setToggleMessengerWindowKeybinding()
      }, { deep: true })
    }),
  )
