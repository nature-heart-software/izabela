import { app, globalShortcut } from 'electron'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import { useMessagesStore } from '@/features/messages/store'
import { Key } from '@/types/keybinds'
import { ipcMain } from 'electron-postman'
import { IzabelaMessage } from '@/modules/izabela/types'
import { purify } from '@packages/toolbox'
import debounce from 'lodash/debounce'
import { IGlobalKeyEvent, IGlobalKeyListener } from 'node-global-key-listener'
import { gkl, handleShortcut, keybindingTriggered } from '@/modules/electron-keybinding/utils'
import { emitIPCCancelAllMessages, emitIPCCancelCurrentMessage } from '@/electron/events/main'
import electronOverlayWindow from '@/teams/overlay/modules/electron-overlay-window'

export default () =>
  app.whenReady().then(async () => {
    const settingsStore = useSettingsStore()
    const messagesStore = useMessagesStore()
    const multiKeysKeybindings = {
      toggleMessengerWindow: handleShortcut(() => electronMessengerWindow.toggleWindow('keyboard')),
      toggleMessengerWindowAlt: handleShortcut(() =>
        electronMessengerWindow.toggleWindow('keyboard'),
      ),
      toggleOverlayWindow: handleShortcut(() => electronOverlayWindow.toggleWindow()),
      cancelCurrentMessage: handleShortcut(() => emitIPCCancelCurrentMessage()),
      cancelAllMessages: handleShortcut(() => emitIPCCancelAllMessages()),
    }
    const registeredShortcuts: Record<string, string> = {}
    const registeredCallbacks: Record<string, IGlobalKeyListener> = {}
    const getAccelerator = (shortcut: Key[]) => shortcut.map(({ key }: Key) => key).join('+')
    const registerElectronShortcut = (accelerator: string, callback: () => void) => {
      try {
        globalShortcut.register(accelerator, callback)
        console.log('[electron-shortcuts] Registered shortcut', accelerator)
      } catch (e: any) {
        console.log("[electron-shortcuts] Couldn't register shortcut", accelerator)
      }
    }
    const unregisterElectronShortcut = (accelerator: string) => {
      try {
        globalShortcut.unregister(accelerator)
      } catch (e: any) {
        console.log("[electron-shortcuts] Couldn't unregister shortcut", accelerator)
      }
    }
    const getShortcuts: () => {
      electron: [Key[], () => void][]
      gkl: [Key[], IGlobalKeyListener][]
    } = () => ({
      electron: [
        [
          settingsStore.keybindings.toggleMessengerWindow,
          multiKeysKeybindings.toggleMessengerWindow,
        ],
      ],
      gkl: [
        [
          settingsStore.keybindings.toggleMessengerWindowAlt,
          (e) => {
            if (e.state === 'DOWN') {
              if (keybindingTriggered(settingsStore.keybindings.toggleMessengerWindowAlt)) {
                multiKeysKeybindings.toggleMessengerWindowAlt()
              }
            }
          },
        ],
        [
          settingsStore.keybindings.toggleOverlayWindow,
          (e) => {
            if (e.state === 'DOWN') {
              if (keybindingTriggered(settingsStore.keybindings.toggleOverlayWindow)) {
                multiKeysKeybindings.toggleOverlayWindow()
              }
            }
          },
        ],
        [
          settingsStore.keybindings.cancelCurrentMessage,
          (e) => {
            if (e.state === 'DOWN') {
              if (keybindingTriggered(settingsStore.keybindings.cancelCurrentMessage)) {
                multiKeysKeybindings.cancelCurrentMessage()
              }
            }
          },
        ],
        [
          settingsStore.keybindings.cancelAllMessages,
          (e) => {
            if (e.state === 'DOWN') {
              if (keybindingTriggered(settingsStore.keybindings.cancelAllMessages)) {
                multiKeysKeybindings.cancelAllMessages()
              }
            }
          },
        ],
      ],
    })

    let shortcuts = getShortcuts()

    const unregisterAllShortcuts = () => {
      shortcuts.electron.forEach(([shortcut]) => {
        const accelerator = getAccelerator(shortcut)
        unregisterElectronShortcut(accelerator)
        delete registeredShortcuts[accelerator]
      })
      shortcuts.gkl.forEach(([shortcut, callback]) => {
        const accelerator = getAccelerator(shortcut)
        gkl?.removeListener(callback)
        unregisterElectronShortcut(accelerator)
        delete registeredShortcuts[accelerator]
      })
      Object.entries(registeredShortcuts).forEach(([accelerator]) => {
        unregisterElectronShortcut(accelerator)
        delete registeredShortcuts[accelerator]
      })
      Object.entries(registeredCallbacks).forEach(([accelerator, callback]) => {
        gkl?.removeListener(callback)
        unregisterElectronShortcut(accelerator)
        delete registeredShortcuts[accelerator]
      })
    }

    const registerAllShortcuts = debounce(() => {
      unregisterAllShortcuts()
      shortcuts = getShortcuts()
      shortcuts.electron.forEach(([shortcut, callback]) => {
        const accelerator = getAccelerator(shortcut)
        registerElectronShortcut(accelerator, callback)
        registeredShortcuts[accelerator] = accelerator
      })
      shortcuts.gkl.forEach(([shortcut, callback]) => {
        const accelerator = getAccelerator(shortcut)
        gkl?.addListener(callback)
        registerElectronShortcut(accelerator, () => null)
        registeredShortcuts[accelerator] = accelerator
      })
      messagesStore.shortcutMessages.forEach((message) => {
        const accelerator = getAccelerator(message.shortcut)
        registeredCallbacks[accelerator] = handleShortcut((e: IGlobalKeyEvent) => {
          if (e.state === 'DOWN' && keybindingTriggered(message.shortcut)) {
            const payload: IzabelaMessage = {
              ...message,
              excludeFromHistory: true,
            }
            ipcMain.sendTo('speech-worker', 'say', purify(payload))
          }
        })
        gkl?.addListener(registeredCallbacks[accelerator])
        registerElectronShortcut(accelerator, () => null)
        registeredShortcuts[accelerator] = accelerator
      })
    }, 500)

    registerAllShortcuts()
    watch(() => [settingsStore.keybindings, messagesStore.shortcutMessages], registerAllShortcuts, {
      deep: true,
    })
  })
