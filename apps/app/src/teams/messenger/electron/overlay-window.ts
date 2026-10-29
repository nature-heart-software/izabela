import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { createProtocol, getLargestMonitorSize } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import gameOverlay from '@/electron/game-overlay'

const createWindow = async (name: string): Promise<BrowserWindow> => {
  const overlayDebug = import.meta.env.DEV ? false : false

  const { width, height } = getLargestMonitorSize()

  const window = gameOverlay.createWindow(name, {
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

  const updateDisplay = () => {
    const { width, height } = getLargestMonitorSize()
    window.setBounds({
      x: 0,
      y: 0,
      width,
      height,
    })
    window.setSize(width, height)
  }
  screen.on('display-metrics-changed', updateDisplay)
  window.once('closed', () => {
    screen.removeListener('display-metrics-changed', updateDisplay)
  })

  if (import.meta.env.DEV && import.meta.env.VITE_OPEN_DEVTOOLS === 'true') {
    window.webContents.openDevTools({ mode: 'undocked' })
  }

  const filePath = `./src/teams/messenger/index.html?game-overlay`
  try {
    if (import.meta.env.VITE_DEV_SERVER_URL) {
      const url = new URL(
        filePath,
        import.meta.env.VITE_DEV_SERVER_URL as string,
      ).href
      await window.loadURL(url)
    } else {
      createProtocol('app')
      await window.loadURL(`app://${filePath}`)
    }
  } catch (error) {
    window.destroy()
    throw error
  }

  if (!overlayDebug) {
    gameOverlay.isReady().then(() => {
      if (!window.isDestroyed())
        gameOverlay.addOverlayWindow(name, window, 0, 0)
    })
  }

  return window
}

export default createWindow
