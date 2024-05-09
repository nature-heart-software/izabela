/* eslint global-require: 0 */
import { autoUpdater } from 'electron-updater'
import { app } from 'electron'

const fallback = async (...args: unknown[]) => {
        console.log('[error]', ...args)
        const version = app.getVersion()
        const channelPart = version.split('-')[1]
        const channel = channelPart ? channelPart.split('.')[0] : 'latest'
        autoUpdater.channel = channel
        autoUpdater.on('update-downloaded', () => {
            autoUpdater.quitAndInstall()
        })
        console.log(
            `[system] A critical error occurred. Proceeding to update the application on the "${ channel }" channel.`,
        )
        return autoUpdater.checkForUpdates()
    }

;(async () => {
    try {
        const gotTheLock = app.requestSingleInstanceLock()
        if (!gotTheLock) {
            console.log('App is already running, check the system tray.')
            return app.quit()
        }
        import('./plugins')
            .then(() => import('./app'))
            .then((module) => module.default.start())
            .catch(fallback)
    } catch (e) {
        console.error(e)
        await fallback()
    }
    return null
})()
