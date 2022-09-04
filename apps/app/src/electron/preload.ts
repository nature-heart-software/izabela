/* High priority plugins */
import '@packages/electron-pinia/dist/preload.es.js'
import '@/modules/electron-log/preload'
import '@/modules/electron-vuex/preload'
/* Other plugins */
import { ipcRenderer } from 'electron-postman'
import { bridgeModules } from '@/electron/bridge'

ipcRenderer.exposeInMainWorld('ipc')
bridgeModules()

declare global {
  interface Window {
    ipc: any
  }
}
