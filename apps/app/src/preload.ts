/* High priority plugins */
import '@/plugins/electron-log/preload'
import '@/modules/electron-vuex/preload'

/* Other plugins */
import '@/plugins/electron-messenger-window'
import { ipcRenderer } from 'electron-postman'

ipcRenderer.exposeInMainWorld('ipc')

declare global {
  interface Window {
    ipc: any
  }
}
