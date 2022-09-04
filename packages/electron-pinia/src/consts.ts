import { AugmentedGlobal } from './types'

export const IPC_EVENT_CONNECT = 'electron-pinia-connect'
export const IPC_EVENT_NOTIFY_MAIN = 'electron-pinia-notify-main'
export const IPC_EVENT_NOTIFY_RENDERERS = 'electron-pinia-notify-renderers'
export const IPC_EVENT_STORE_GET = 'electron-pinia-store-get'
export const IPC_EVENT_STORE_SET = 'electron-pinia-store-set'
export const IPC_EVENT_STORE_DELETE = 'electron-pinia-store-delete'
export const ELECTRON_STORAGE_NAME = 'electron-pinia'

export const isRenderer = typeof window !== 'undefined'
export const isPreload = !!(
  typeof window !== 'undefined' && window.ElectronPiniaIsPreload
)
export const isMain = !isRenderer && !isPreload
export const ipcMain =
  isMain && typeof global !== 'undefined'
    ? (global as AugmentedGlobal).ipcMain
    : null
export const ipcRenderer =
  isRenderer && typeof window !== 'undefined' ? window.ElectronPinia : null
