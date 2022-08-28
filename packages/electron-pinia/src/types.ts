import { PiniaPluginContext } from 'pinia'
import type ElectronStore from 'electron-store'
import type Electron from 'electron'

export type StoreOptions = PiniaPluginContext['options'] & {
  electron?: {
    shared?: boolean
    persisted?: boolean
  }
}

export type PersistedStateOptions = {
  storageName?: string
}
export type AugmentedGlobal = typeof global & {
  ElectronPiniaStorage: ElectronStore | null
  ipcMain: Electron.IpcMain
}
export type ProcessType = 'main' | 'renderer'

export type IpcMainMutationEventHandler = (event: Electron.IpcMainEvent) => void

export type IpcRendererMutationEventHandler = (
  event: Electron.IpcRendererEvent,
) => void

export type IpcRenderer = {
  SEND_IPC_EVENT_CONNECT: () => void
  ON_IPC_EVENT_NOTIFY_RENDERERS: (
    handler: IpcRendererMutationEventHandler,
  ) => void
  SEND_IPC_EVENT_NOTIFY_MAIN: (payload: any) => void
}

export type Connections = { [key: string]: Electron.IpcMainEvent['sender'] }

declare global {
  interface Window {
    ElectronPinia: { ipcRenderer: IpcRenderer }
    ElectronPiniaStore: ElectronStore
    ElectronPiniaIsPreload?: boolean
  }

  interface Global {
    ipcMain: Electron.IpcMain
    ElectronPiniaStorage: ElectronStore
  }
}
