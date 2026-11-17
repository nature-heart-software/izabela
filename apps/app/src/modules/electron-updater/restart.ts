import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

let updateDownloaded = false
let updateRestartPending = false

export const registerUpdateRestart = () => {
  autoUpdater.once('update-downloaded', () => {
    updateDownloaded = true
  })
}

export const restartApp = () => {
  if (import.meta.env.VITE_DISABLE_AUTO_UPDATE !== 'true' && updateDownloaded) {
    // A duplicate quitAndInstall clears the updater's own install guard.
    if (updateRestartPending) return
    updateRestartPending = true
    let installFailed = false
    const onInstallError = () => {
      installFailed = true
    }
    autoUpdater.once('error', onInstallError)
    try {
      // Let the installer reopen the app only after replacing its files.
      autoUpdater.quitAndInstall(true, true)
    } catch (error) {
      installFailed = true
      throw error
    } finally {
      autoUpdater.removeListener('error', onInstallError)
      // Keep reentrant requests blocked until the updater finishes unwinding.
      if (installFailed) updateRestartPending = false
    }
    return
  }
  app.relaunch()
  app.exit()
}
