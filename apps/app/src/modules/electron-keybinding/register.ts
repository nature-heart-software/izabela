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
import { IGlobalKeyDownMap, IGlobalKeyEvent, IGlobalKeyListener } from 'node-global-key-listener'
import { gkl, handleShortcut, keybindingTriggered } from '@/modules/electron-keybinding/utils'
import { emitIPCCancelAllMessages, emitIPCCancelCurrentMessage } from '@/electron/events/main'

export default () =>
  app.whenReady().then(async () => {
    const settingsStore = useSettingsStore()
    const messagesStore = useMessagesStore()
    const multiKeysKeybindings = {
      toggleMessengerWindow: handleShortcut(() => electronMessengerWindow.toggleWindow('keyboard')),
      toggleMessengerWindowAlt: handleShortcut(() => electronMessengerWindow.toggleWindow('mouse')),
      cancelCurrentMessage: handleShortcut(() => emitIPCCancelCurrentMessage()),
      cancelAllMessages: handleShortcut(() => emitIPCCancelAllMessages()),
    }
    const registeredShortcuts: Record<string, string> = {}
    const registeredCallbacks: Record<
      string,
      (e: IGlobalKeyEvent, down: IGlobalKeyDownMap) => void
    > = {}

    const toggleMessengerWindowListener: IGlobalKeyListener = (e, down) => {
      if (e.state === 'DOWN') {
        if (keybindingTriggered(settingsStore.keybindings.toggleMessengerWindowAlt)) {
          multiKeysKeybindings.toggleMessengerWindowAlt()
        }
      }
    }

    const cancelCurrentMessageListener: IGlobalKeyListener = (e, down) => {
      if (e.state === 'DOWN') {
        if (keybindingTriggered(settingsStore.keybindings.cancelCurrentMessage)) {
          multiKeysKeybindings.cancelCurrentMessage()
        }
      }
    }

    const cancelAllMessagesListener: IGlobalKeyListener = (e, down) => {
      if (e.state === 'DOWN') {
        if (keybindingTriggered(settingsStore.keybindings.cancelAllMessages)) {
          multiKeysKeybindings.cancelAllMessages()
        }
      }
    }

    const unregisterAllShortcuts = () => {
      gkl?.removeListener(toggleMessengerWindowListener)
      Object.keys(registeredShortcuts).forEach((key) => {
        globalShortcut.unregister(registeredShortcuts[key])
        delete registeredShortcuts[key]
      })
      Object.keys(registeredCallbacks).forEach((key) => {
        gkl?.removeListener(registeredCallbacks[key])
        gkl?.removeListener(cancelCurrentMessageListener)
        gkl?.removeListener(cancelAllMessagesListener)
        delete registeredShortcuts[key]
      })
    }

    const setToggleMessengerWindowKeybinding = () => {
      const keybinding = settingsStore.keybindings.toggleMessengerWindow
        .map(({ key }: Key) => key)
        .join('+')

      gkl?.addListener(toggleMessengerWindowListener)
      gkl?.addListener(cancelCurrentMessageListener)
      gkl?.addListener(cancelAllMessagesListener)
      globalShortcut.register(keybinding, multiKeysKeybindings.toggleMessengerWindow)
      registeredShortcuts.toggleMessengerWindow = keybinding
    }

    const setShortcutMessagesKeybindings = () => {
      messagesStore.shortcutMessages.forEach((message) => {
        registeredCallbacks[message.id] = handleShortcut((e: IGlobalKeyEvent) => {
          if (e.state === 'DOWN' && keybindingTriggered(message.shortcut)) {
            const payload: IzabelaMessage = {
              ...message,
              excludeFromHistory: true,
            }
            ipcMain.sendTo('speech-worker', 'say', purify(payload))
          }
        })
        gkl?.addListener(registeredCallbacks[message.id])
      })
      // messagesStore.shortcutMessages.forEach((message) => {
      //   const keybinding = message.shortcut.map(({ key }: Key) => key).join('+')
      //   if (!keybinding) return
      //   try {
      //     globalShortcut.register(keybinding, () => {
      //       const payload: IzabelaMessage = {
      //         ...message,
      //         excludeFromHistory: true,
      //       }
      //       ipcMain.sendTo('speech-worker', 'say', purify(payload))
      //     })
      //     registeredShortcuts[message.id] = keybinding
      //   } catch (e) {
      //     console.error(`Couldn't register shortcut "${ keybinding }"`, e)
      //   }
      // })
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
