import { ActionPayload, Dispatch, MutationPayload, Store, Commit } from 'vuex'
import type ElectronStore from 'electron-store'

export type MutationFilter = (mutationPayload: MutationPayload) => boolean
export type MutationFilterOption = string[] | MutationFilter | undefined
export type PersistedStateOptions = {
  storageName?: string
  whitelist?: MutationFilterOption
  blacklist?: MutationFilterOption
}
export type AugmentedGlobal = typeof global & {
  ElectronVuexStorage: ElectronStore
  ipcMain: Electron.IpcMain
}
export type ProcessType = 'main' | 'renderer'
export type IpcMainMutationEventHandler = (
  event: Electron.IpcMainEvent,
  mutationPayload?: MutationPayload,
) => void
export type IpcRendererMutationEventHandler = (
  event: Electron.IpcRendererEvent,
  mutationPayload?: MutationPayload,
) => void
export type IpcRenderer = {
  SEND_IPC_EVENT_CONNECT: () => void
  ON_IPC_EVENT_NOTIFY_RENDERERS: (handler: IpcRendererMutationEventHandler) => void
  SEND_IPC_EVENT_NOTIFY_MAIN: (payload: MutationPayload) => void
}
export type StoreOption = Store<unknown> & {
  originalCommit: Commit
  originalDispatch: Dispatch
  dispatch: (type: string, payload: ActionPayload) => void
}
export type Connections = { [key: string]: Electron.IpcMainEvent['sender'] }

declare global {
  interface Window {
    ElectronVuex: { ipcRenderer: IpcRenderer; winId: number }
    ElectronVuexStorage: ElectronStore
    ElectronVuexIsPreload?: boolean
  }

  interface Global {
    ipcMain: Electron.IpcMain
    ElectronVuexStorage: ElectronStore
  }
}
