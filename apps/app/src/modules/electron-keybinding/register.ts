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
import { IGlobalKeyListener } from 'node-global-key-listener'
import {
  gkl,
  handleShortcut,
  createShortcutListener,
} from '@/modules/electron-keybinding/utils'
import {
  emitIPCApplyProfile,
  emitIPCCancelAllMessages,
  emitIPCCancelCurrentMessage,
} from '@/electron/events/main'
import electronOverlayWindow from '@/teams/overlay/modules/electron-overlay-window'
import { useProfilesStore } from '@/features/profiles/store.ts'
import { canRegisterElectronShortcut } from './accelerator'

export default () =>
  app.whenReady().then(async () => {
    const settingsStore = useSettingsStore()
    const messagesStore = useMessagesStore()
    const profilesStore = useProfilesStore()
    const multiKeysKeybindings = {
      toggleMessengerWindow: handleShortcut(() =>
        electronMessengerWindow.toggleWindow('keyboard'),
      ),
      toggleMessengerWindowAlt: handleShortcut(() =>
        electronMessengerWindow.toggleWindow('keyboard', true),
      ),
      toggleOverlayWindow: handleShortcut(() =>
        electronOverlayWindow.toggleWindow(),
      ),
      cancelCurrentMessage: handleShortcut(() => emitIPCCancelCurrentMessage()),
      cancelAllMessages: handleShortcut(() => emitIPCCancelAllMessages()),
    }
    const registeredShortcuts: Record<string, string> = {}
    const registeredCallbacks = new Set<IGlobalKeyListener>()
    const getAccelerator = (shortcut: Key[]) =>
      shortcut.map(({ key }: Key) => key).join('+')
    const registerElectronShortcut = (
      accelerator: string,
      callback: () => void,
    ) => {
      if (!canRegisterElectronShortcut(accelerator)) return
      try {
        globalShortcut.register(accelerator, callback)
        console.log('[electron-shortcuts] Registered shortcut', accelerator)
      } catch (e: any) {
        console.log(
          "[electron-shortcuts] Couldn't register shortcut",
          accelerator,
        )
      }
    }
    const unregisterElectronShortcut = (accelerator: string) => {
      if (!canRegisterElectronShortcut(accelerator)) return
      try {
        globalShortcut.unregister(accelerator)
      } catch (e: any) {
        console.log(
          "[electron-shortcuts] Couldn't unregister shortcut",
          accelerator,
        )
      }
    }
    type Shortcuts = {
      electron: [Key[], () => void][]
      gkl: [Key[], IGlobalKeyListener][]
    }
    const getShortcuts = (): Shortcuts => {
      const shortcuts: Shortcuts = {
        electron: [
          [
            settingsStore.keybindings.toggleMessengerWindow,
            multiKeysKeybindings.toggleMessengerWindow,
          ],
        ],
        gkl: [
          [
            settingsStore.keybindings.toggleMessengerWindowAlt,
            createShortcutListener(
              settingsStore.keybindings.toggleMessengerWindowAlt,
              multiKeysKeybindings.toggleMessengerWindowAlt,
            ),
          ],
          [
            settingsStore.keybindings.toggleOverlayWindow,
            createShortcutListener(
              settingsStore.keybindings.toggleOverlayWindow,
              () => {
                if (settingsStore.enableOverlayWindow)
                  multiKeysKeybindings.toggleOverlayWindow()
              },
            ),
          ],
          [
            settingsStore.keybindings.cancelCurrentMessage,
            createShortcutListener(
              settingsStore.keybindings.cancelCurrentMessage,
              multiKeysKeybindings.cancelCurrentMessage,
            ),
          ],
          [
            settingsStore.keybindings.cancelAllMessages,
            createShortcutListener(
              settingsStore.keybindings.cancelAllMessages,
              multiKeysKeybindings.cancelAllMessages,
            ),
          ],
        ],
      }
      const electron: Shortcuts['electron'] = []
      for (const [shortcut, callback] of shortcuts.electron) {
        if (canRegisterElectronShortcut(getAccelerator(shortcut))) {
          electron.push([shortcut, callback])
        } else {
          shortcuts.gkl.push([
            shortcut,
            createShortcutListener(shortcut, callback),
          ])
        }
      }
      return { electron, gkl: shortcuts.gkl }
    }

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
      registeredCallbacks.forEach((callback) => {
        gkl?.removeListener(callback)
      })
      registeredCallbacks.clear()
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
        if (!message.shortcut.length) return
        const accelerator = getAccelerator(message.shortcut)
        const callback = createShortcutListener(message.shortcut, () => {
          const payload: IzabelaMessage = {
            ...message,
            excludeFromHistory: true,
          }
          ipcMain.sendTo('speech-worker', 'say', purify(payload))
        })
        registeredCallbacks.add(callback)
        gkl?.addListener(callback)
        registerElectronShortcut(accelerator, () => null)
        registeredShortcuts[accelerator] = accelerator
      })
      profilesStore.profiles.forEach((profile) => {
        if (!profile.shortcut.length) return
        const accelerator = getAccelerator(profile.shortcut)
        const callback = createShortcutListener(profile.shortcut, () => {
          emitIPCApplyProfile(profile.id)
          if (profile.openMessengerOnTrigger) {
            electronMessengerWindow.focus('keyboard', true)
          }
        })
        registeredCallbacks.add(callback)
        gkl?.addListener(callback)
        registerElectronShortcut(accelerator, () => null)
        registeredShortcuts[accelerator] = accelerator
      })
    }, 500)

    registerAllShortcuts()
    watch(
      () => [
        settingsStore.keybindings,
        messagesStore.shortcutMessages,
        profilesStore.profiles,
      ],
      registerAllShortcuts,
      {
        deep: true,
      },
    )
  })
