import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import { useGameOverlayStore } from '@/features/game-overlay/store'
import { app } from 'electron'
import { exec } from 'child_process'
import { Deferred } from '@packages/toolbox'
import { isRunningAsAdmin } from '@/electron/utils.ts'

function restartAsAdmin() {
  const deferred = Deferred()
  if (process.platform === 'win32') {
    const appPath = process.execPath
    exec(
      `powershell -Command "Start-Process -FilePath '${appPath.replace(
        /'/g,
        "''",
      )}' -Verb RunAs"`,
      (error) => {
        if (!error) {
          app.quit()
        } else {
          console.error('Failed to restart as admin:', error)
          deferred.resolve(true)
        }
      },
    )
  } else {
    console.warn('Admin restart is only implemented for Windows.')
    deferred.resolve(true)
  }
  return deferred.promise
}

async function relaunchOverlayWithoutElevation() {
  if (process.platform !== 'win32') return false
  const sdk: typeof import('electron-game-overlay') = require('electron-game-overlay')
  const context = await sdk.inspectOverlayConsumerExecutionContext()
  if (context.overlaySupported) return false
  if (!context.relaunchAvailable)
    throw new Error(
      `Normal-permission overlay launch unavailable: ${context.relaunchRefusal}`,
    )

  app.releaseSingleInstanceLock()
  try {
    const result = await sdk.launchUnelevatedOverlayConsumer({ context })
    if (result.status === 'launched') {
      console.info('[electron-startup] Normal-permission replacement launched')
      app.quit()
      return true
    }
  } catch (error) {
    if (!app.requestSingleInstanceLock()) {
      app.quit()
      return true
    }
    throw error
  }
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return true
  }
  return false
}

const setLaunchOnStartup = (launchOnStartup: boolean) => {
  console.log('[electron-startup] Launch on startup:', launchOnStartup)
  app.setLoginItemSettings({
    openAtLogin: launchOnStartup,
    path: app.getPath('exe'),
  })
}

export default () =>
  app.whenReady().then(() => {
    const deferred = Deferred()
    const settingsStore = useSettingsStore()
    const gameOverlayStore = useGameOverlayStore()

    Promise.all([settingsStore.$whenReady(), gameOverlayStore.$whenReady()])
      .then(async () => {
        // Persisted profiles can predate the renderer's opt-in guard. Decide
        // before starting services so they cannot elevate an overlay launch.
        if (gameOverlayStore.enableExperimentalGameOverlay) {
          settingsStore.runAsAdmin = false
          try {
            // A normal restart inherits elevation. Let the SDK verify and
            // create a fresh normal-permission consumer before services start.
            if (await relaunchOverlayWithoutElevation()) return
          } catch (error) {
            console.error(
              '[electron-startup] Overlay launch handoff failed:',
              error,
            )
          }
        }
        setLaunchOnStartup(settingsStore.launchOnStartup)
        if (
          import.meta.env.PROD &&
          settingsStore.runAsAdmin &&
          !isRunningAsAdmin()
        ) {
          restartAsAdmin().then(() => {
            deferred.resolve(true)
          })
        } else {
          deferred.resolve(true)
        }
        watch(
          () => settingsStore.launchOnStartup,
          () => {
            setLaunchOnStartup(settingsStore.launchOnStartup)
          },
        )
      })
      .catch((reason) => deferred.reject(reason))

    return deferred.promise
  })
