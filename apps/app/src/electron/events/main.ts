import { processes } from '@/types/electron'
import { ipcMain } from 'electron-postman'

export const onIPCProcessError = (callback: (error: Error, process: string) => any) => {
  processes.forEach((process) => {
    ipcMain.on(process, 'error', (payload: { name: string; message: string }) =>
      callback(payload, process),
    )
  })
}

export const emitIPCCancelCurrentMessage = () => {
  ipcMain.sendTo('speech-worker', 'cancel-current-message')
}

export const emitIPCCancelAllMessages = () => {
  ipcMain.sendTo('speech-worker', 'cancel-all-messages')
}

export const emitIPCOverlayInput = (character: string) => {
  ipcMain.sendTo('overlay', 'overlay-input', character)
}
