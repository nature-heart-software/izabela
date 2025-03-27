import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import { app } from 'electron'
import { exec } from 'child_process'
import { Deferred } from '@packages/toolbox'
import { isRunningAsAdmin } from '@/electron/utils.ts'

function restartAsAdmin() {
  const deferred = Deferred()
  if (process.platform === 'win32') {
    const appPath = process.execPath
    exec(
      `powershell -Command "Start-Process -FilePath '${appPath.replace(/'/g, "''")}' -Verb RunAs"`,
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

    settingsStore
      .$whenReady()
      .then(() => {
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
