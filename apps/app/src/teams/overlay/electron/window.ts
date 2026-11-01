import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { createProtocol } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import electronOverlayWindow from '@/teams/overlay/modules/electron-overlay-window'

const createWindow = async (name: string): Promise<BrowserWindow> => {
  const window = new BrowserWindow({
    show: false,
    fullscreen: true,
    transparent: true,
    frame: false,
    resizable: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: Boolean(
        Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      ),
      contextIsolation: !Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      sandbox: false,
    },
  })
  ipcMain.registerBrowserWindow(name, window)
  window.webContents.setMaxListeners(Infinity)

  {
    const primaryDisplay = screen.getPrimaryDisplay()
    window.setBounds(primaryDisplay.bounds)

    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    window.setAlwaysOnTop(true)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
    window.setIgnoreMouseEvents(true)
  }

  if (import.meta.env.DEV && import.meta.env.VITE_OPEN_DEVTOOLS === 'true') {
    window.webContents.openDevTools({ mode: 'undocked' })
  }

  const filePath = `./src/teams/${name}/index.html`
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
  electronOverlayWindow.start(window)

  return window
}

export default createWindow
