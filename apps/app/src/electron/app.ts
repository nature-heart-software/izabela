import { app, BrowserWindow, protocol } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path'
import server from '@apps/app-server'
import { electronPiniaPlugin } from '@packages/electron-pinia/main'
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import createTray from '@/teams/tray/electron-tray'
import ElectronWindowManager from '@/modules/electron-window-manager'
import { createMessengerWindow } from '@/teams/messenger/electron/background'
import { createSpeechWorkerWindow } from '@/teams/speech-worker/electron/background'
import { bridgeModules } from '@/electron/bridge'
import registerElectronStartup from '@/modules/electron-startup/register'
import registerElectronUpdater from '@/modules/electron-updater/register'
import registerElectronDebug from '@/modules/electron-debug/register'
import registerElectronDisplay from '@/modules/electron-display/register'
import registerElectronKeybinding from '@/modules/electron-keybinding/register'
import registerElectronCache from '@/modules/electron-cache/register'
import { destroyWinMouse } from '@/modules/node-mouse'
import { createOverlayWindow } from '@/teams/overlay/electron/background'

const App = () => {
  const isDevelopment = import.meta.env.DEV
  const createWindows = () =>
    app
      .whenReady()
      .then(async () =>
        Promise.all([
          await ElectronWindowManager.registerInstance('messenger', createMessengerWindow),
          await ElectronWindowManager.registerInstance('overlay', createOverlayWindow),
          await ElectronWindowManager.registerInstance('speech-worker', createSpeechWorkerWindow),
        ]),
      )

  const registerElectronPinia = () => {
    createApp(h({})).use(createPinia().use((electronPiniaPlugin.default || electronPiniaPlugin)()))
  }

  const startAppServer = async () =>
    app.whenReady().then(async () =>
      server.start({
        tempPath: path.join(app.getPath('userData'), 'temp'),
        port: import.meta.env.VITE_SERVER_PORT,
        ws: {
          port: import.meta.env.VITE_SERVER_WS_PORT,
        },
      }),
    )

  const configureAppDefaults = () => {
    if (process.platform === 'win32') app.setAppUserModelId(app.name)
    app.commandLine.appendSwitch('disable-renderer-backgrounding')
    app.commandLine.appendSwitch('ignore-certificate-errors')
    app.commandLine.appendSwitch('wm-window-animations-disabled')

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

  const onQuit = () => {
    /* fixes app.quit(): https://stackoverflow.com/a/75369483 */
    ElectronWindowManager.getInstances().forEach(({ window }) => {
      window.removeAllListeners()
    })
    destroyWinMouse()
  }

  function addEventListeners() {
    app.whenReady().then(() => {
      const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
      const googleCloudSpeechCredentialsFilePath = path.join(
        credentialsDirPath,
        'google-cloud-speech-credentials.json',
      )
      process.env.GOOGLE_APPLICATION_CREDENTIALS = googleCloudSpeechCredentialsFilePath
    })

    app.on('ready', async () => {
      if (isDevelopment) {
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

    const handleQuit = (quitApp = false) => {
      onQuit()
      if (quitApp) {
        app.quit()
      }
    }

    process.on('message', (data) => {
      if (process.platform === 'win32' && data === 'graceful-exit') {
        handleQuit(true)
      }
    })
    ;['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
      process.on(signal, () => {
        handleQuit(true)
      })
    })

    app.on('before-quit', () => {
      handleQuit()
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        handleQuit(true)
      }
    })
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
      exec('Handle Cache', () => registerElectronCache()),
    ])
  }

  return {
    start,
    isDevelopment,
    exec,
  }
}

export default App()
