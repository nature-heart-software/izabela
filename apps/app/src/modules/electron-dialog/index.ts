import { dialog } from 'electron'

export const createElectronDialog = () => ({
  showOpenDialog(options: Electron.OpenDialogOptions): ReturnType<typeof dialog.showOpenDialog> {
    return dialog.showOpenDialog(options)
  },
})

export default createElectronDialog()
