import { bridge } from '@packages/electron-bridger'
import electronDialog from '@/modules/electron-dialog'
import electronFilesystem from '@/modules/electron-filesystem'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import electronKeybinding from '@/modules/electron-keybinding'
import electronDisplay from '@/modules/electron-display'

export const bridgeModules = () =>
  bridge.register([
    ['ElectronDialog', () => electronDialog],
    ['ElectronFilesystem', () => electronFilesystem],
    ['ElectronMessengerWindow', () => electronMessengerWindow],
    ['ElectronKeybinding', () => electronKeybinding],
    ['ElectronDisplay', () => electronDisplay],
  ])

declare global {
  interface Window {
    ElectronDialog: typeof electronDialog
    ElectronFilesystem: typeof electronFilesystem
    ElectronMessengerWindow: typeof electronMessengerWindow
    ElectronKeybinding: typeof electronKeybinding
    ElectronDisplay: typeof electronDisplay
  }
}
