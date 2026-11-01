/* High priority plugins */
import '@packages/electron-pinia/preload'
import '@/modules/electron-log/preload'
import '@/plugins/preload'
/* Other plugins */
import { ipcRenderer } from 'electron-postman'
import { bridgePreloadModules } from './preload-bridge'

ipcRenderer.exposeInMainWorld('ipc')
bridgePreloadModules()

declare global {
  interface Window {
    ipc: any
  }
}
