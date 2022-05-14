/* High priority plugins */
import '@/plugins/electron-log/preload'
import '@/modules/electron-vuex/preload'
import '@/modules/electron-dialog'
import '@/modules/electron-filesystem'

/* Other plugins */
import '@/entities/messenger/modules/electron-messenger-window'
import { ipcRenderer } from 'electron-postman'

ipcRenderer.exposeInMainWorld('ipc')

declare global {
  interface Window {
    ipc: any
  }
}
