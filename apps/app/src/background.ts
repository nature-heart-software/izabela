/* import plugins first, starting with the store and vuex-electron */
import '@/modules/electron-vuex/main'
import '@/store'
import '@/plugins/electron-log'
import '@/teams/speech-worker/plugins/electron-speech'
import '@/plugins/electron-startup'
import '@/plugins/electron-updater'
import '@/modules/electron-dialog'
import '@/modules/electron-filesystem'
import { app, BrowserWindow, protocol } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import createTray from '@/teams/tray/electron-tray'
import server from '@izabela/app-server'
import path from 'path'
import ElectronWindowManager from '@/modules/electron-window-manager'
import { createMessengerWindow } from '@/teams/messenger/background'
import { createSpeechWorkerWindow } from '@/teams/speech-worker/background'

;(() => {
  if (process.platform === 'win32') app.setAppUserModelId(app.name)
  app.commandLine.appendSwitch('disable-renderer-backgrounding')

  /* Fixes iohook. See: https://github.com/electron/electron/issues/18397 */
  app.allowRendererProcessReuse = false

  /* Disabling Hardware Acceleration does the following:
   * - fixes ui freeze in DevTools when unfocused
   * - fixes ui freeze on other hardware accelerated softwares (chrome, vs code, ...)
   * - fixes element selection in DevTools
   */
  app.disableHardwareAcceleration()
})()

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
])

const createWindows = async () =>
  Promise.all([
    await ElectronWindowManager.registerInstance('messenger', createMessengerWindow),
    await ElectronWindowManager.registerInstance('speech-worker', createSpeechWorkerWindow),
  ])

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const startAppServer = async () =>
  server.startServer({
    tempPath: path.join(app.getPath('userData'), 'temp'),
    port: process.env.VUE_APP_SERVER_PORT,
  })
app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindows()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', (e as Error).toString())
    }
  }
  createTray()
  createWindows()
  startAppServer()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
