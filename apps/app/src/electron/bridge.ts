import { bridge } from '@izabela/electron-bridger'
import electronDialog from '@/modules/electron-dialog'
import electronFilesystem from '@/modules/electron-filesystem'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'

export const bridgeModules = () =>
  bridge.register([
    ['ElectronDialog', () => electronDialog],
    ['ElectronFilesystem', () => electronFilesystem],
    ['ElectronMessengerWindow', () => electronMessengerWindow],
  ])

declare global {
  interface Window {
    ElectronDialog: typeof electronDialog
    ElectronFilesystem: typeof electronFilesystem
    ElectronMessengerWindow: typeof electronMessengerWindow
  }
}
