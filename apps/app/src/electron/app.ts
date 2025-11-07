import '@/plugins/node'
import { app, BrowserWindow, protocol } from 'electron'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path'
import server from '@apps/app-server'
import { electronPiniaPlugin } from '@packages/electron-pinia/main'
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import createTray from '@/teams/tray/electron-tray'
import ElectronWindowManager from '@/modules/electron-window-manager'
import {
  createMessengerGameOverlayWindow,
  createMessengerWindow,
} from '@/teams/messenger/electron/background'
import { createSpeechWorkerWindow } from '@/teams/speech-worker/electron/background'
import { bridgeModules } from '@/electron/bridge'
import registerElectronStartup from '@/modules/electron-startup/register'
import registerElectronUpdater from '@/modules/electron-updater/register'
import registerElectronDebug from '@/modules/electron-debug/register'
import registerElectronDisplay from '@/modules/electron-display/register'
import registerElectronKeybinding from '@/modules/electron-keybinding/register'
import registerElectronCache from '@/modules/electron-cache/register'
import { stopMouse } from '@/modules/node-mouse'
import { createOverlayWindow } from '@/teams/overlay/electron/background'
import './game-overlay'
import gameOverlay from '@/electron/game-overlay.ts'
import { gkl } from '@/modules/electron-keybinding/utils.ts'
import { loadStores } from '@/store/stores.ts'

const App = () => {
  const isDevelopment = import.meta.env.DEV
  const createWindows = () =>
    app
      .whenReady()
      .then(async () =>
        Promise.all([
          ElectronWindowManager.registerInstance(
            'messenger',
            createMessengerWindow,
          ),
          ElectronWindowManager.registerInstance(
            'overlay',
            createOverlayWindow,
          ),
          ElectronWindowManager.registerInstance(
            'speech-worker',
            createSpeechWorkerWindow,
          ),
          ElectronWindowManager.registerInstance(
            'messenger-game-overlay',
            createMessengerGameOverlayWindow,
          ),
        ]),
      )

  const registerElectronPinia = () => {
    createApp(h({})).use(
      createPinia().use((electronPiniaPlugin.default || electronPiniaPlugin)()),
    )
  }

  const registerStores = () => {
    return loadStores()
  }

  const startGameOverlay = async () =>
    app.whenReady().then(() => gameOverlay.start())

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
    if (import.meta.env.DEV) app.commandLine.appendSwitch('disable-http-cache')

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
    gkl?.kill()
    gameOverlay.quit()
    /* fixes app.quit(): https://stackoverflow.com/a/75369483 */
    ElectronWindowManager.getInstances().forEach(({ window }) => {
      window.removeAllListeners()
    })
    stopMouse()
  }

  function addEventListeners() {
    app.whenReady().then(() => {
      const credentialsDirPath = path.join(
        app.getPath('userData'),
        'credentials',
      )
      const googleCloudSpeechCredentialsFilePath = path.join(
        credentialsDirPath,
        'google-cloud-speech-credentials.json',
      )
      process.env.GOOGLE_APPLICATION_CREDENTIALS =
        googleCloudSpeechCredentialsFilePath
    })

    app.on('ready', async () => {
      if (isDevelopment) {
        try {
          await ((installExtension as any).default as typeof installExtension)(
            VUEJS_DEVTOOLS,
          )
        } catch (e) {
          console.error(
            'Vue Devtools failed to install:',
            (e as Error).toString(),
          )
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

    app.on('web-contents-created', (_, webContents) => {
      webContents.on('preload-error', (_, preloadPath, error) => {
        console.error(
          `Preload script error:\nPath: ${preloadPath}\nError:`,
          error,
        )
      })
    })
  }

  function start() {
    return Promise.all([
      exec('Register app listeners', () => addEventListeners()),
      exec('Configure app defaults', () => configureAppDefaults()),
      exec('Register electron-pinia', () => registerElectronPinia()),
      exec('Load stores', () => registerStores()),
      /* Check if app needs to run as admin before continuing */
      exec('Register startup', () => registerElectronStartup()),
    ]).then(async () => {
      return Promise.all([
        exec('Register updater', () => registerElectronUpdater()),
        exec('Register debug', () => registerElectronDebug()),
        exec('Bridge modules', () => bridgeModules()),
        exec('Start Game Overlay', () => startGameOverlay()),
        exec('Create tray', () => createTray()),
        exec('Create windows', () => createWindows()),
        exec('Start server', () => startAppServer()),
        exec('Register display', () => registerElectronDisplay()),
        exec('Register keybindings', () => registerElectronKeybinding()),
        exec('Handle Cache', () => registerElectronCache()),
      ])
    })
  }

  return {
    start,
    isDevelopment,
    exec,
  }
}

export default App()
