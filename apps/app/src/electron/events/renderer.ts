import { processes } from '@/types/electron'
import { IzabelaMessage } from '@/modules/izabela/types'

const { ipc } = window

export const emitIPCProcessError = (payload: { name: string; message: string }) => {
  processes.forEach((process) => {
    ipc.sendTo(process, 'error', payload)
  })
}

type IPCSayPayload = string | IzabelaMessage

export const onIPCSay = (callback: (payload: IPCSayPayload) => any) => {
  processes.forEach((process) => {
    ipc.on(process, 'say', callback)
  })
}

export const emitIPCSay = (payload: IPCSayPayload) => {
  ipc.sendTo('speech-worker', 'say', payload)
}

export const onIPCCancelCurrentMessage = (callback: () => any) => {
  processes.forEach((process) => {
    ipc.on(process, 'cancel-current-message', callback)
  })
}

export const onIPCCancelAllMessages = (callback: () => void) => {
  processes.forEach((process) => {
    ipc.on(process, 'cancel-all-messages', callback)
  })
}

export const onIPCOverlayInputCharacter = (callback: (key: any) => void) => {
  processes.forEach((process) => {
    ipc.on(process, 'overlay-input-character', callback)
  })
}

export const onIPCOverlayInputCommand = (callback: (args: any[]) => void) => {
  processes.forEach((process) => {
    ipc.on(process, 'overlay-input-command', callback)
  })
}
