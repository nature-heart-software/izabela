import { BrowserWindow, screen } from 'electron'
import path from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { ipcMain } from 'electron-postman'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import store from '@/store'

const createWindow = async (name: string): Promise<BrowserWindow> => {
  const win = new BrowserWindow({
    show: false,
    fullscreen: true,
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
  })

  ipcMain.registerBrowserWindow(name, win)

  {
    const { workArea } = screen.getPrimaryDisplay()

    win.setSize(workArea.width, workArea.height)
    win.setPosition(workArea.x, workArea.y)

    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    win.setAlwaysOnTop(true)
    win.setVisibleOnAllWorkspaces(true)
    win.setFullScreenable(false)
  }

  win.once('ready-to-show', () => {
    win.on('show', () => {
      store.dispatch('messenger/setProperty', ['isShown', true])
    })
    win.on('hide', () => {
      store.dispatch('messenger/setProperty', ['isShown', false])
    })
    win.on('focus', () => {
      store.dispatch('messenger/setProperty', ['isFocused', true])
    })
    win.on('blur', () => {
      store.dispatch('messenger/setProperty', ['isFocused', false])
    })
    electronMessengerWindow.start()
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(path.join(process.env.WEBPACK_DEV_SERVER_URL as string, name))
    if (!process.env.IS_TEST) win.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    win.loadURL(`app://./${name}.html`)
  }

  return win
}

export default createWindow
