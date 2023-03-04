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
