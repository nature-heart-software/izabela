import { app, BrowserWindow } from 'electron'
import path from 'path'
import { createProtocol } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import gameOverlay from '@/electron/game-overlay'

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  const filePath = `./src/teams/messenger/index.html`
  const url =
    (import.meta.env.VITE_DEV_SERVER_URL
      ? path.join(import.meta.env.VITE_DEV_SERVER_URL as string, filePath)
      : `app://${filePath}`) + '?game-overlay'
  const overlayDebug = import.meta.env.DEV ? false : false

  window = gameOverlay.createWindow(name, {
    x: 0,
    y: 0,
    height: 1080,
    width: 1920,
    frame: false,
    show: overlayDebug,
    transparent: true,
    resizable: false,
    enableLargerThanScreen: true,
    webPreferences: {
      offscreen: !overlayDebug,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: Boolean(
        Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      ),
      contextIsolation: !Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      sandbox: false,
    },
  })
  window.setSize(1920, 1080)
  ipcMain.registerBrowserWindow(name, window)

  if (import.meta.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(url)
    if (import.meta.env.DEV)
      window.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    window.loadURL(url)
  }

  if (!overlayDebug) {
    gameOverlay.addOverlayWindow(name, window, 0, 0)
  }

  return window
}

export default createWindow
