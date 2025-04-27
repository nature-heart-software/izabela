import { mainProcess, processes } from '@/types/electron'
import { IzabelaMessage } from '@/modules/izabela/types'

const { ipc } = window

export const emitIPCProcessError = (payload: {
  name: string
  message: string
}) => {
  processes.forEach((process) => {
    ipc.sendTo(process, 'error', payload)
  })
}

export const emitIPCGameOverlayStartIntercept = () => {
  ipc.sendTo(mainProcess, 'game-overlay-start-intercept')
}

export const emitIPCGameOverlayStopIntercept = () => {
  ipc.sendTo(mainProcess, 'game-overlay-stop-intercept')
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

export const onIPCGameOverlayResize = (
  callback: (size: { width: number; height: number }) => void,
) => {
  processes.forEach((process) => {
    ipc.on(process, 'resize', callback)
  })
}

export const onIPCApplyProfile = (callback: (id: string) => void) => {
  processes.forEach((process) => {
    ipc.on(process, 'apply-profile', callback)
  })
}
