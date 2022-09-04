import { ipcMain } from 'electron'
import { AugmentedGlobal } from './types'
import { plugin } from './plugin'
import { ELECTRON_STORAGE_NAME } from './consts'
import ElectronStore from 'electron-store'
import background from './background'
import 'pinia'

;(global as AugmentedGlobal).ElectronPiniaStorage = new ElectronStore({
  name: ELECTRON_STORAGE_NAME,
})
;(global as AugmentedGlobal).ipcMain = ipcMain

background.start()

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    electron?: {
      persisted?: boolean
      shared?: boolean
    }
  }
}

export { plugin as electronPiniaPlugin } from './plugin'
export default plugin
