import { BrowserWindow } from 'electron'
import { ipcMain } from 'electron-postman'
import path from 'path'
import { createProtocol, getTopLeftWindow } from '@/electron/utils'
import electronSpeechWorkerWindow from '@/teams/speech-worker/modules/electron-speech-worker-window'
import { windowHeight, windowWidth } from '@/teams/speech-worker/electron/const'

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  const topLeftDisplay = getTopLeftWindow()

  window = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: (topLeftDisplay?.bounds.x ?? 0) - windowWidth,
    y: (topLeftDisplay?.bounds.y ?? 0) - windowHeight,
    show: true,
    transparent: true,
    frame: false,
    focusable: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: Boolean(
        Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      ),
      contextIsolation: !Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      backgroundThrottling: false,
      sandbox: false,
    },
  })

  {
    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    window.setAlwaysOnTop(true, 'screen-saver', 1)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)

    window.webContents.setBackgroundThrottling(false)
  }

  window.once('ready-to-show', () => {
    electronSpeechWorkerWindow.start(window)
  })

  ipcMain.registerBrowserWindow(name, window)

  ipcMain.registerBrowserWindow(name, window)

  const filePath = `./src/teams/${name}/index.html`

  if (import.meta.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(
      path.join(import.meta.env.VITE_DEV_SERVER_URL as string, filePath),
    )
    if (import.meta.env.DEV)
      window.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    window.loadURL(`app://${filePath}`)
  }

  return window
}

export default createWindow
