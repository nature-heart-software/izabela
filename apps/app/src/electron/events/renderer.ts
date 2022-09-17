import { processes } from '@/types/electron'
import { IzabelaMessagePayload } from '@/modules/izabela/types'

const { ipc } = window

export const emitIPCProcessError = (payload: { name: string; message: string }) => {
  processes.forEach((process) => {
    ipc.sendTo(process, 'error', payload)
  })
}

type IPCSayPayload = string | IzabelaMessagePayload

export const onIPCSay = (callback: (payload: IPCSayPayload) => any) => {
  processes.forEach((process) => {
    ipc.on(process, 'say', callback)
  })
}

export const emitIPCSay = (payload: IPCSayPayload) => {
  ipc.sendTo('speech-worker', 'say', payload)
}

export const onIPCStartSpeechTranscription = (payload: () => any) => {
  ipc.on('main', 'start-speech-transcription', payload)
}

export const onIPCStopSpeechTranscription = (payload: () => any) => {
  ipc.on('main', 'stop-speech-transcription', payload)
}
