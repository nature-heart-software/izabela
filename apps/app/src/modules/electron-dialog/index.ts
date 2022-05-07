import { bridge } from '@izabela/electron-bridger'
import { dialog } from 'electron'

class ElectronDialog {
  showOpenDialog(options: Electron.OpenDialogOptions): ReturnType<typeof dialog.showOpenDialog> {
    return dialog.showOpenDialog(options)
  }
}

declare global {
  interface Window {
    ElectronDialog: ElectronDialog
  }
}

export default ((): ElectronDialog => bridge.new(ElectronDialog)())()
