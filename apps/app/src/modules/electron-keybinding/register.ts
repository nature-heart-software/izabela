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
        const keybinding = store.getters['settings/persisted'].keybindings.toggleMessengerWindow
          .map(({ key }: any) => key)
          .join('+')
        globalShortcut.register(keybinding, multiKeysKeybindings.toggleMessengerWindow)
        registeredShortcuts.toggleMessengerWindow = keybinding
      }
      setToggleMessengerWindowKeybinding()

      watch(
        () => [store.getters['settings/persisted'].keybindings.toggleMessengerWindow],
        () => {
          unregisterAllShortcuts()
          setToggleMessengerWindowKeybinding()
        },
        { deep: true },
      )
    }),
  )
