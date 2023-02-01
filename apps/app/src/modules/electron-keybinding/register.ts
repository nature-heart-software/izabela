import { app, globalShortcut } from 'electron'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import { useMessagesStore } from '@/features/messages/store'
import { Key } from '@/types/keybinds'
import { ipcMain } from 'electron-postman'
import { IzabelaMessage } from '@/modules/izabela/types'
import { purify } from '@packages/toolbox'
import { debounce } from 'lodash'

export default () =>
  app.whenReady().then(() => {
    const settingsStore = useSettingsStore()
    const messagesStore = useMessagesStore()
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
        .map(({ key }: Key) => key)
        .join('+')
      globalShortcut.register(keybinding, multiKeysKeybindings.toggleMessengerWindow)
      registeredShortcuts.toggleMessengerWindow = keybinding
    }

    const setShortcutMessagesKeybindings = () => {
      messagesStore.shortcutMessages.forEach((message) => {
        const keybinding = message.shortcut.map(({ key }: Key) => key).join('+')
        if (!keybinding) return
        try {
          globalShortcut.register(keybinding, () => {
            const payload: IzabelaMessage = {
              ...message,
              excludeFromHistory: true,
            }
            ipcMain.sendTo(
              'speech-worker',
              'say',
              purify(payload),
            )
          })
          registeredShortcuts[message.id] = keybinding
        } catch (e) {
          console.error(`Couldn't register shortcut "${ keybinding }"`, e)
        }
      })
    }

    const registerAllShortcuts = debounce(() => {
      unregisterAllShortcuts()
      setToggleMessengerWindowKeybinding()
      setShortcutMessagesKeybindings()
    }, 500)

    registerAllShortcuts()
    watch(
      () => [settingsStore.keybindings.toggleMessengerWindow, messagesStore.shortcutMessages],
      registerAllShortcuts,
      { deep: true },
    )
  })
