/* eslint global-require: 0 */
import { autoUpdater } from 'electron-updater'

const fallback = async () => {
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
  })
  return autoUpdater.checkForUpdates()
}

;(async () => {
  try {
    require('./plugins')
    require('./app').default.start().catch(fallback)
  } catch (e) {
    await fallback()
  }
})()
