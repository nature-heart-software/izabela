import { BrowserWindow } from 'electron'
import { ipcMain } from 'electron-postman'
import path from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  window = new BrowserWindow({
    show: true,
    transparent: true,
    frame: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
  })

  {
    window.setSize(0, 0)
    window.setPosition(0, 0)

    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    window.setAlwaysOnTop(true)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
  }

  ipcMain.registerBrowserWindow(name, window)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await window.loadURL(path.join(process.env.WEBPACK_DEV_SERVER_URL as string, name))
    if (!process.env.IS_TEST) window.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    window.loadURL(`app://./${name}.html`)
  }

  return window
}

export default createWindow
