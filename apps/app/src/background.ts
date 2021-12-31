import { app, protocol, BrowserWindow } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import createMessengerWindow from '@/teams/messenger/electron-window'
import ElectronWindowManager from '@/modules/electron-window-manager'

// Plugins
import '@/plugins/electron-messenger-window'
import '@/modules/electron-vuex/preload'
import '@/store'

;(() => {
  /* Disabling Hardware Acceleration does the following:
   * - fixes ui freeze in DevTools when unfocused
   * - fixes ui freeze on other hardware accelerated softwares (chrome, vs code, ...)
   * - fixes element selection in DevTools
   * - /!\ disables mousemove events on transparent elements (prevents blur on mouse leave)
   * It is better to disable it in development but to keep it in production I think
   * There are fallbacks to make both work anyway, the only difference is that there's no
   * automatic blur on mouseleave from the messenger window when Hardware Acceleration is disabled
   */
  if (process.env.NODE_ENV === 'development') app.disableHardwareAcceleration()
})()

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
])

const createWindows = async () =>
  Promise.all([ElectronWindowManager.registerInstance('messenger', await createMessengerWindow())])

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
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
  createWindows()
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
