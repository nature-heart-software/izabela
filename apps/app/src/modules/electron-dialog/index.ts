import { dialog } from 'electron'
import { createNotification } from '@/utils/electron-notification.ts'

export const ElectronDialog = () => ({
  showOpenDialog(
    options: Electron.OpenDialogOptions,
  ): ReturnType<typeof dialog.showOpenDialog> {
    return dialog.showOpenDialog(options)
  },
  showNotification(options: Parameters<typeof createNotification>[0]) {
    createNotification({
      ...options,
    }).show()
  },
})

export default ElectronDialog()
