/* eslint global-require: 0 */
import { autoUpdater } from 'electron-updater'
import { app } from 'electron'

const fallback = async () => {
  const version = app.getVersion()
  const channelPart = version.split('-')[1]
  const channel = channelPart ? channelPart.split('.')[0] : 'latest'
  autoUpdater.channel = channel
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
  })
  console.log(
    `[system] A critical error occured. Proceeding to update the application on the "${channel}" channel.`,
  )
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
