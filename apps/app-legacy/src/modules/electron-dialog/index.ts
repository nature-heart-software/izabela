import { dialog } from 'electron'

export const ElectronDialog = () => ({
  showOpenDialog(options: Electron.OpenDialogOptions): ReturnType<typeof dialog.showOpenDialog> {
    return dialog.showOpenDialog(options)
  },
})

export default ElectronDialog()
