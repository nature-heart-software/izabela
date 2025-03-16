import { app, screen, BrowserWindow } from 'electron'
import path from 'path'
import { createProtocol } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import gameOverlay from '@/electron/game-overlay'

const getLargestMonitorSize = () => {
  const displays = screen.getAllDisplays()
  let width = 0
  let height = 0

  displays.forEach((display) => {
    const { size } = display
    if (size.width > width) width = size.width
    if (size.height > height) height = size.height
  })

  return { width, height }
}

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  const overlayDebug = import.meta.env.DEV ? false : false

  const { width, height } = getLargestMonitorSize()
  console.log(width, height)
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

  window.webContents.once('did-finish-load', () => {
    if (import.meta.env.DEV) {
      window.webContents.openDevTools({ mode: 'undocked' })
    }
  })

  const filePath = `./src/teams/messenger/index.html?game-overlay`
  if (import.meta.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(
      path.join(import.meta.env.VITE_DEV_SERVER_URL as string, filePath),
    )
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
