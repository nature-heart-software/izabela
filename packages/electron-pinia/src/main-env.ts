import { ipcMain } from 'electron'
import { ELECTRON_STORAGE_NAME } from './consts'
import ElectronStore from 'electron-store'

global.ElectronPiniaStorage = new ElectronStore({
  name: ELECTRON_STORAGE_NAME,
})
global.ipcMain = ipcMain
