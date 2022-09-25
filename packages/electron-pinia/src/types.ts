import { PiniaPluginContext } from 'pinia'
import type ElectronStore from 'electron-store'
import type Electron from 'electron'
import { Ref } from 'vue'

export type StoreOptions = PiniaPluginContext['options'] & {
  electron?: {
    shared?: boolean
    persisted?: boolean
  }
}

export type PluginCustomProperties = {
  $isReady: Ref<boolean>
  $whenReady: () => Promise<boolean>
}

export type Connections = { [key: string]: Electron.IpcMainEvent['sender'] }

export type ShareStatePayload = {
  name: string
  storeId: string
  args: (any | { issuer: string })[]
}

export type IpcRendererEventHandler<A extends any[] = any[]> = (
  event: Electron.IpcRendererEvent,
  ...arg: A
) => void
export type IpcMainEventHandler<A extends any[] = any[]> = (
  event: Electron.IpcMainEvent,
  ...arg: A
) => void
export type IpcMainInvokeEventHandler<
  A extends any[] = any[],
  R extends any = any,
> = (event: Electron.IpcMainInvokeEvent, ...arg: A) => R | Promise<R>

declare global {
  interface Window {
    ElectronPinia: {
      SEND_IPC_EVENT_CONNECT: () => Promise<number>
      ON_IPC_EVENT_NOTIFY_RENDERERS: (
        handler: IpcRendererEventHandler<[ShareStatePayload]>,
      ) => void
      SEND_IPC_EVENT_NOTIFY_MAIN: (payload: ShareStatePayload) => void
    }
    ElectronPiniaStorage: ElectronStore
    ElectronPiniaIsPreload?: boolean
  }

  var ElectronPiniaStorage: ElectronStore
  var ipcMain: Electron.IpcMain
}
