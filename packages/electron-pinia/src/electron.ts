export const isRenderer = typeof window !== 'undefined'
export const isPreload = !!(
    typeof window !== 'undefined' && window.ElectronPiniaIsPreload
)
export const isMain = !isRenderer && !isPreload

export const ipcMain =
    isMain ? require('electron').ipcMain : null
export const ipcRenderer =
    isRenderer && typeof window !== 'undefined' ? window.ElectronPinia : null
