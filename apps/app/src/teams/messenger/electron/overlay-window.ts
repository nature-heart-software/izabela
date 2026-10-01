import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { createProtocol, getLargestMonitorSize } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import gameOverlay from '@/electron/game-overlay'

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  const overlayDebug = import.meta.env.DEV ? false : false

  const { width, height } = getLargestMonitorSize()

  window = gameOverlay.createWindow(name, {
    x: 0,
    y: 0,
    height,
    width,
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
  window.webContents.setMaxListeners(Infinity)
  window.setSize(width, height)
  window.webContents.setFrameRate(240)
  ipcMain.registerBrowserWindow(name, window)

  screen.on('display-metrics-changed', () => {
    const { width, height } = getLargestMonitorSize()
    window.setBounds({
      x: 0,
      y: 0,
      width,
      height,
    })
    window.setSize(width, height)
  })

  if (import.meta.env.DEV && import.meta.env.VITE_OPEN_DEVTOOLS === 'true') {
    window.webContents.openDevTools({ mode: 'undocked' })
  }

  const filePath = `./src/teams/messenger/index.html?game-overlay`
  if (import.meta.env.VITE_DEV_SERVER_URL) {
    const url = new URL(filePath, import.meta.env.VITE_DEV_SERVER_URL as string)
      .href
    await window.loadURL(url)
  } else {
    createProtocol('app')
    await window.loadURL(`app://${filePath}`)
  }

  if (!overlayDebug) {
    gameOverlay
      .isReady()
      .then(() => gameOverlay.addOverlayWindow(name, window, 0, 0))
  }

  return window
}

export default createWindow
