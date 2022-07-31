import { processes } from '@/types/electron'
import { ipcMain } from 'electron-postman'

export const onIPCProcessError = (callback: (error: Error, process: string) => any) => {
  processes.forEach((process) => {
    ipcMain.on(process, 'error', (payload: { name: string; message: string }) =>
      callback(payload, process),
    )
  })
}
