import { bridge, isRenderer } from '@izabela/electron-bridger'
import {
  IPC_EVENT_CONNECT,
  IPC_EVENT_NOTIFY_MAIN,
  IPC_EVENT_NOTIFY_RENDERERS,
} from '@/modules/electron-vuex/consts'
import ElectronStore from 'electron-store'
import { contextBridge, ipcRenderer, ipcMain } from 'electron'
import IpcMain = Electron.IpcMain
import { MutationPayload } from 'vuex'
import {
  AugmentedGlobal,
  IpcRenderer,
  IpcRendererMutationEventHandler,
} from '@/modules/electron-vuex/types'

class ElectronVuexStorage {
  store: ElectronStore | null = null

  constructor() {
    this.store = isRenderer ? null : new ElectronStore({ name: 'vuex' })
  }

  ['set'](...args: [string, unknown]) {
    if (!this.store) return
    return this.store.set(...args)
  }

  ['get'](...args: [string]) {
    if (!this.store) return
    return this.store.get(...args)
  }

  ['delete'](...args: [string]) {
    if (!this.store) return
    return this.store.delete(...args)
  }
}

const { store } = bridge.new(ElectronVuexStorage)()

if (isRenderer) {
  contextBridge.exposeInMainWorld('ElectronVuex', {
    winId: ipcRenderer.sendSync('electron-vuex-get-win-id'),
    ipcRenderer: {
      'SEND_IPC_EVENT_CONNECT': function() {
        ipcRenderer.send(IPC_EVENT_CONNECT)
      },
      'SEND_IPC_EVENT_NOTIFY_MAIN': function(payload: MutationPayload) {
        ipcRenderer.send(IPC_EVENT_NOTIFY_MAIN, payload)
      },
      'ON_IPC_EVENT_NOTIFY_RENDERERS': function(handler: IpcRendererMutationEventHandler) {
        ipcRenderer.on(IPC_EVENT_NOTIFY_RENDERERS, handler)
      },
    },
  })
  window.ElectronVuexIsPreload = true
} else {
  ipcMain.on('electron-vuex-get-win-id', (e) => {
    e.returnValue = e.sender.id
  })
  ElectronStore.initRenderer()
  ;(global as AugmentedGlobal).ElectronVuexStorage = store
  ;(global as AugmentedGlobal).ipcMain = ipcMain
}

declare global {
  interface Window {
    ElectronVuex: { ipcRenderer: IpcRenderer; winId: number }
    ElectronVuexStorage: ElectronStore
    ElectronVuexIsPreload?: boolean
  }

  interface Global {
    ipcMain: IpcMain
    ElectronVuexStorage: ElectronStore
  }
}
