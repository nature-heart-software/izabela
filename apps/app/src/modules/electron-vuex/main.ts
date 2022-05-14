import { ipcMain } from 'electron'
import ElectronStore from 'electron-store'
import { AugmentedGlobal } from '@/modules/electron-vuex/types'
import storage from './storage'

const { store } = storage
ipcMain.on('electron-vuex-get-win-id', (e) => {
  e.returnValue = e.sender.id
})
ElectronStore.initRenderer()
;(global as AugmentedGlobal).ElectronVuexStorage = store
;(global as AugmentedGlobal).ipcMain = ipcMain
