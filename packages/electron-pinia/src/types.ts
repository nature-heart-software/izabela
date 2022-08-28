import { PiniaPluginContext } from 'pinia'
import type ElectronStore from 'electron-store'
import type Electron from 'electron'

export type StoreOptions = PiniaPluginContext['options'] & {
  electron?: {
    shared?: boolean
    persisted?: boolean
  }
}

export type IpcRendererMutationEventHandler = (
  event: Electron.IpcRendererEvent,
) => void

declare global {
  interface Window {
    ElectronPinia: {
      SEND_IPC_EVENT_CONNECT: () => void
      ON_IPC_EVENT_NOTIFY_RENDERERS: (
        handler: IpcRendererMutationEventHandler,
      ) => void
      SEND_IPC_EVENT_NOTIFY_MAIN: (payload: any) => void
    }
    ElectronPiniaStorage: ElectronStore
    ElectronPiniaIsPreload?: boolean
  }

  interface Global {
    ipcMain: Electron.IpcMain
    ElectronPiniaStorage: ElectronStore
  }
}
