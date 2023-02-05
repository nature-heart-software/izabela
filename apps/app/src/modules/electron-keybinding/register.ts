import { app, globalShortcut } from 'electron'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import { useMessagesStore } from '@/features/messages/store'
import { Key } from '@/types/keybinds'
import { ipcMain } from 'electron-postman'
import { IzabelaMessage } from '@/modules/izabela/types'
import { purify } from '@packages/toolbox'
import { debounce, find } from 'lodash'
import {
  GlobalKeyboardListener,
  IGlobalKeyEvent,
  IGlobalKeyListener,
} from "node-global-key-listener"
import nativeKeymap from '@packages/native-keymap'

const gkl = new GlobalKeyboardListener()
export default () =>
  app.whenReady().then(async () => {
    const settingsStore = useSettingsStore()
    const messagesStore = useMessagesStore()
    const typedKeys: Partial<Record<Required<IGlobalKeyEvent>['name'], any>> = {}
    const keyCodeMap: any = {
      ControlRight: "VK_RCONTROL",
      ControlLeft: "VK_LCONTROL",
      ShiftRight: "VK_RSHIFT",
      ShiftLeft: "VK_LSHIFT",
      AltRight: "VK_RMENU",
      AltLeft: "VK_LMENU",
      MetaRight: "VK_RWIN",
      MetaLeft: "VK_LWIN",
    }
    const keymapByVKey = Object.fromEntries(Object.entries(nativeKeymap.getKeyMap()).map(([code, value]) => ([keyCodeMap[code] || (value as any).vkey, {
        ...value,
        code,
        vkey: keyCodeMap[code] || (value as any).vkey,
      }]),
    ))
    const multiKeysKeybindings = {
      toggleMessengerWindow: () => electronMessengerWindow.toggleWindow(),
    }
    const registeredShortcuts: Record<string, string> = {}

    const toggleMessengerWindowListener: IGlobalKeyListener = (e, down) => {
      if (e.state === 'DOWN') {
        if (e.name) typedKeys[e.name] = {
          event: e,
          // eslint-disable-next-line no-underscore-dangle
          nativeKey: keymapByVKey[e.rawKey._nameRaw],
        }
        const downNames = Object.entries(down).map(([name, value]) => value ? name : null).filter(Boolean) as string[]
        if (settingsStore.keybindings.toggleMessengerWindowAlt.map((key) => {
          const typedKey = find(typedKeys, (t) => t.nativeKey.code.includes(key.code))
          return downNames.includes(typedKey?.event.name)
        }).every(Boolean)) {
          multiKeysKeybindings.toggleMessengerWindow()
        }
      }
    }
    const unregisterAllShortcuts = () => {
      gkl.removeListener(toggleMessengerWindowListener)
      Object.keys(registeredShortcuts).forEach((key) => {
        globalShortcut.unregister(registeredShortcuts[key])
        delete registeredShortcuts[key]
      })
    }

    const setToggleMessengerWindowKeybinding = () => {
      const keybinding = settingsStore.keybindings.toggleMessengerWindow
        .map(({ key }: Key) => key)
        .join('+')

      gkl.addListener(toggleMessengerWindowListener)
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
            ipcMain.sendTo('speech-worker', 'say', purify(payload))
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
