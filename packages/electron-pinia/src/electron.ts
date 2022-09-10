import { AugmentedGlobal } from './types'


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
