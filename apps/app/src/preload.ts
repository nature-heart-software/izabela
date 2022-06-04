/* High priority plugins */
import '@/modules/electron-log/preload'
import '@/modules/electron-vuex/preload'

/* Other plugins */
import { ipcRenderer } from 'electron-postman'
import { loadBridgedModules } from '@/electron-loaders'

ipcRenderer.exposeInMainWorld('ipc')
loadBridgedModules()

declare global {
  interface Window {
    ipc: any
  }
}
