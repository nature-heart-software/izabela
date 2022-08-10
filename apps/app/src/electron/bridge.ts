import { bridge } from 'electron-bridger'
import electronDialog from '@/modules/electron-dialog'
import electronFilesystem from '@/modules/electron-filesystem'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import electronKeybinding from '@/modules/electron-keybinding'

export const bridgeModules = () =>
  bridge.register([
    ['ElectronDialog', () => electronDialog],
    ['ElectronFilesystem', () => electronFilesystem],
    ['ElectronMessengerWindow', () => electronMessengerWindow],
    ['ElectronKeybinding', () => electronKeybinding],
  ])

declare global {
  interface Window {
    ElectronDialog: typeof electronDialog
    ElectronFilesystem: typeof electronFilesystem
    ElectronMessengerWindow: typeof electronMessengerWindow
    ElectronKeybinding: typeof electronKeybinding
  }
}
