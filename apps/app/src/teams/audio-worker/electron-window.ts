import { BrowserWindow } from 'electron'
import path from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { ipcMain } from 'electron-postman'

const createAudioWorkerWindow = async (): Promise<BrowserWindow> => {
  const win = new BrowserWindow({
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

  ipcMain.registerBrowserWindow('audio-worker-window', win)

  {
    win.setSize(0, 0)
    win.setPosition(0, 0)

    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    win.setAlwaysOnTop(true)
    win.setVisibleOnAllWorkspaces(true)
    win.setFullScreenable(false)
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(path.join(process.env.WEBPACK_DEV_SERVER_URL as string, 'audio-worker'))
    if (!process.env.IS_TEST) win.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    win.loadURL('app://./audio-worker.html')
  }

  return win
}

export default createAudioWorkerWindow
