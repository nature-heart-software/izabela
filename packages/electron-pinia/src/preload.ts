import {
  IPC_EVENT_CONNECT,
  IPC_EVENT_NOTIFY_MAIN,
  IPC_EVENT_NOTIFY_RENDERERS,
  IPC_EVENT_STORE_DELETE,
  IPC_EVENT_STORE_GET,
  IPC_EVENT_STORE_SET,
} from '@/consts'
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ElectronPinia', {
  ipcRenderer: {
    SEND_IPC_EVENT_CONNECT() {
      ipcRenderer.send(IPC_EVENT_CONNECT)
    },
    SEND_IPC_EVENT_NOTIFY_MAIN(payload: any) {
      ipcRenderer.send(IPC_EVENT_NOTIFY_MAIN, payload)
    },
    ON_IPC_EVENT_NOTIFY_RENDERERS(handler: any) {
      ipcRenderer.on(IPC_EVENT_NOTIFY_RENDERERS, handler)
    },
  },
})

contextBridge.exposeInMainWorld('ElectronPiniaStore', {
  get(name: string) {
    ipcRenderer.send(IPC_EVENT_STORE_GET, { name })
  },
  set(name: string, state: any) {
    ipcRenderer.send(IPC_EVENT_STORE_SET, { name, state })
  },
  delete(name: string) {
    ipcRenderer.send(IPC_EVENT_STORE_DELETE, { name })
  },
})

window.ElectronPiniaIsPreload = true
