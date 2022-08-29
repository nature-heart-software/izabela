import { ipcMain } from 'electron'
import { AugmentedGlobal } from './types'
import { plugin } from './plugin'
import { ELECTRON_STORAGE_NAME } from './consts'
import ElectronStore from 'electron-store'

;(global as AugmentedGlobal).ElectronPiniaStorage = new ElectronStore({
  name: ELECTRON_STORAGE_NAME,
})
;(global as AugmentedGlobal).ipcMain = ipcMain

export { plugin } from './plugin'
export default plugin
