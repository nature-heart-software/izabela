import {
  IPC_EVENT_CONNECT,
  IPC_EVENT_NOTIFY_MAIN,
  IPC_EVENT_NOTIFY_RENDERERS,
} from '@/modules/electron-vuex/consts'
import { contextBridge, ipcRenderer } from 'electron'
import { MutationPayload } from 'vuex'
import { IpcRendererMutationEventHandler } from '@/modules/electron-vuex/types'
import './storage'

contextBridge.exposeInMainWorld('ElectronVuex', {
  winId: ipcRenderer.sendSync('electron-vuex-get-win-id'),
  ipcRenderer: {
    SEND_IPC_EVENT_CONNECT() {
      ipcRenderer.send(IPC_EVENT_CONNECT)
    },
    SEND_IPC_EVENT_NOTIFY_MAIN(payload: MutationPayload) {
      ipcRenderer.send(IPC_EVENT_NOTIFY_MAIN, payload)
    },
    ON_IPC_EVENT_NOTIFY_RENDERERS(handler: IpcRendererMutationEventHandler) {
      ipcRenderer.on(IPC_EVENT_NOTIFY_RENDERERS, handler)
    },
  },
})
window.ElectronVuexIsPreload = true
