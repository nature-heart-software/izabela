import { autoUpdater } from 'electron-updater'
import store from '@/store'
import { createNotification } from '@/utils/electron-notification'
import { app } from 'electron'

export default () =>
  app.whenReady().then(() =>
    store.getters
      .isReady()
      .then(app.whenReady)
      .then(() => {
        const channel = store.getters['settings/persisted'].updateChannel
        console.log('[electron-updater] Auto-update channel:', channel)
        autoUpdater.channel = channel
        const notification = createNotification({
          title: `${app.name} update available`,
          body: `A new update has been downloaded and will install on exit.`,
        })
        return autoUpdater.checkForUpdatesAndNotify(notification)
      }),
  )
