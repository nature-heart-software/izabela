import '@/modules/electron-log/plugin'
import { ipcMain, ipcRenderer } from 'electron'

ipcMain?.setMaxListeners(Infinity)
ipcRenderer?.setMaxListeners(Infinity)
