import { autoUpdater } from 'electron-updater'

const fallback = () => {
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
  })
  autoUpdater.checkForUpdates()
}

try {
  // eslint-disable-next-line global-require
  require('./plugins')
} catch (e) {
  fallback()
}

;(() => {
  // eslint-disable-next-line global-require
  require('./app').default.start().catch(fallback)
})()
