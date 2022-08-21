import { contextBridge } from 'electron'
import log from 'electron-log'
import './defaults'

contextBridge.exposeInMainWorld('log', log.functions)

declare global {
  interface Window {
    log: typeof log.functions
  }
}
