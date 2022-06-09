/* eslint global-require: 0 */
import { autoUpdater } from 'electron-updater'

const fallback = () => {
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
  })
  autoUpdater.checkForUpdates()
}

;(() => {
  try {
    require('./plugins')
    require('./app').default.start().catch(fallback)
  } catch (e) {
    fallback()
  }
})()
