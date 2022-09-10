import { app, globalShortcut } from 'electron'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

export default () =>
  app.whenReady().then(() => {
      const settingsStore = useSettingsStore()
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
        const keybinding = settingsStore.keybindings.toggleMessengerWindow
          .map(({ key }: any) => key)
          .join('+')
        globalShortcut.register(keybinding, multiKeysKeybindings.toggleMessengerWindow)
        registeredShortcuts.toggleMessengerWindow = keybinding
      }
      setToggleMessengerWindowKeybinding()

      watch(
        () => [settingsStore.keybindings.toggleMessengerWindow],
        () => {
          unregisterAllShortcuts()
          setToggleMessengerWindowKeybinding()
        },
        { deep: true },
      )
    },
  )
