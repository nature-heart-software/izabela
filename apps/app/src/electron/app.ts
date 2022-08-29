import { app, BrowserWindow, protocol } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import createTray from '@/teams/tray/electron-tray'
import ElectronWindowManager from '@/modules/electron-window-manager'
import { createMessengerWindow } from '@/teams/messenger/electron/background'
import { createSpeechWorkerWindow } from '@/teams/speech-worker/electron/background'
import server from '@apps/app-server'
import path from 'path'
import { bridgeModules } from '@/electron/bridge'
import registerElectronStartup from '@/modules/electron-startup/register'
import registerElectronUpdater from '@/modules/electron-updater/register'
import registerElectronDebug from '@/modules/electron-debug/register'
import registerElectronDisplay from '@/modules/electron-display/register'
import registerElectronKeybinding from '@/modules/electron-keybinding/register'
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import electronPiniaPlugin from '@packages/electron-pinia'

const App = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const createWindows = () =>
    app
      .whenReady()
      .then(async () =>
        Promise.all([
          await ElectronWindowManager.registerInstance('messenger', createMessengerWindow),
          await ElectronWindowManager.registerInstance('speech-worker', createSpeechWorkerWindow),
        ]),
      )

  const registerElectronPinia = () => {
    createApp(h({})).use(createPinia().use(electronPiniaPlugin));
  }

  const startAppServer = async () =>
    app.whenReady().then(async () =>
      server.start({
        tempPath: path.join(app.getPath('userData'), 'temp'),
        port: process.env.VUE_APP_SERVER_PORT,
      }),
    )

  const configureAppDefaults = () => {
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

    // Scheme must be registered before the app is ready
    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } },
    ])
  }

  function exec(description: string, action: () => any) {
    console.log(`[app]: ${description}`)
    return action()
  }

  function addEventListeners() {
    app.on('ready', async () => {
      if (isDevelopment && !process.env.IS_TEST) {
        try {
          await installExtension(VUEJS3_DEVTOOLS)
        } catch (e) {
          console.error('Vue Devtools failed to install:', (e as Error).toString())
        }
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindows()
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

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
  }

  function start() {
    return Promise.all([
      exec('Register app listeners', () => addEventListeners()),
      exec('Configure app defaults', () => configureAppDefaults()),
      exec('Register electron-pinia', () => registerElectronPinia()),
      exec('Register updater', () => registerElectronUpdater()),
      exec('Register startup', () => registerElectronStartup()),
      exec('Register debug', () => registerElectronDebug()),
      exec('Bridge modules', () => bridgeModules()),
      exec('Create tray', () => createTray()),
      exec('Create windows', () => createWindows()),
      exec('Start server', () => startAppServer()),
      exec('Register display', () => registerElectronDisplay()),
      exec('Register keybindings', () => registerElectronKeybinding()),
    ])
  }

  return {
    start,
    isDevelopment,
    exec,
  }
}

export default App()
