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
      nodeIntegration: Boolean(Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION)),
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

  if (import.meta.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(path.join(import.meta.env.VITE_DEV_SERVER_URL as string, `/src/teams/${ name }/index.html`))
    if (import.meta.env.DEV) window.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    window.loadURL(`app://./${ name }.html`)
  }

  return window
}

export default createWindow
