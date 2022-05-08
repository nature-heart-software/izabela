import { BrowserWindow, screen } from 'electron'
import path from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { ipcMain } from 'electron-postman'

const createMessengerWindow = async (): Promise<BrowserWindow> => {
  const win = new BrowserWindow({
    fullscreen: true,
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
  })

  ipcMain.registerBrowserWindow('messenger-window', win)

  {
    const { workArea } = screen.getPrimaryDisplay()

    win.setSize(workArea.width, workArea.height)
    win.setPosition(workArea.x, workArea.y)

    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    win.setAlwaysOnTop(true)
    win.setVisibleOnAllWorkspaces(true)
    win.setFullScreenable(false)
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) win.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }
  win.on('ready-to-show', () => {
    win.on('show', () => ipcMain.sendTo('messenger-window', 'show'))
    win.on('hide', () => ipcMain.sendTo('messenger-window', 'hide'))
    win.on('focus', () => ipcMain.sendTo('messenger-window', 'focus'))
    win.on('blur', () => ipcMain.sendTo('messenger-window', 'blur'))
    // win.webContents.openDevTools({ mode: 'undocked' })
  })

  return win
}

export default createMessengerWindow
