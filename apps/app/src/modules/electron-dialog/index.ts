import { dialog } from 'electron'
import { createNotification } from '@/utils/electron-notification.ts'
import { v4 as uuid } from 'uuid'

export const dialogsMap = new Map<string, Promise<any>>()
export const ElectronDialog = () => ({
  showOpenDialog(
    options: Electron.OpenDialogOptions,
  ): Promise<Electron.OpenDialogReturnValue> {
    const id = uuid()
    const dialogInstance = dialog.showOpenDialog(options)
    dialogsMap.set(id, dialogInstance)
    dialogInstance.finally(() => {
      dialogsMap.delete(id)
    })
    return dialogInstance
  },
  showSaveDialog(
    window: Electron.BaseWindow,
    options: Electron.SaveDialogOptions,
  ): Promise<Electron.SaveDialogReturnValue> {
    const id = uuid()
    const dialogInstance = dialog.showSaveDialog(window, options)
    dialogsMap.set(id, dialogInstance)
    dialogInstance.finally(() => {
      dialogsMap.delete(id)
    })
    return dialogInstance
  },
  showNotification(options: Parameters<typeof createNotification>[0]) {
    createNotification({
      ...options,
    }).show()
  },
})

export default ElectronDialog()
