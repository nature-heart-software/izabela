import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { createProtocol } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  window = new BrowserWindow({
    show: false,
    fullscreen: true,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: Boolean(
        Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      ),
      contextIsolation: !Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      sandbox: false,
    },
  })

  {
    const primaryDisplay = screen.getPrimaryDisplay()
    window.setBounds(primaryDisplay.bounds)

    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    window.setAlwaysOnTop(true, 'screen-saver', 1)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
    window.setMenu(null)
  }

  window.once('ready-to-show', () => {
    electronMessengerWindow.start(window)
  })

  ipcMain.registerBrowserWindow(name, window)

  const filePath = `./src/teams/${name}/index.html`

  window.webContents.once('did-finish-load', () => {
    if (import.meta.env.DEV) {
      setTimeout(() => {
        window.webContents.openDevTools({ mode: 'detach' })
      }, 300)
    }
  })

  const url = import.meta.env.VITE_DEV_SERVER_URL
    ? path.join(import.meta.env.VITE_DEV_SERVER_URL as string, filePath)
    : `app://${filePath}`
  if (import.meta.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(url)
  } else {
    createProtocol('app')
    window.loadURL(url)
  }

  return window
}

export default createWindow
