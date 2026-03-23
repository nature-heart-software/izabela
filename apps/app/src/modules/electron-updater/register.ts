import { autoUpdater } from 'electron-updater'
import { createNotification } from '@/utils/electron-notification'
import { app } from 'electron'
import { useSettingsStore } from '@/features/settings/store'

export default () =>
  app.whenReady().then(() => {
    const settingsStore = useSettingsStore()
    return settingsStore.$whenReady().then(() => {
      if (!settingsStore.enableAutoUpdate) return
      const channel = settingsStore.updateChannel
      console.log('[electron-updater] Auto-update channel:', channel)
      autoUpdater.channel = channel
      const notification = createNotification({
        title: `${app.name} update available`,
        body: `A new update has been downloaded and will install on exit.`,
      })
      return autoUpdater
        .checkForUpdatesAndNotify(notification)
        .catch((error) => {
          console.warn(
            '[electron-updater] Failed to fetch updates:',
            error instanceof Error ? error.message : error,
          )
          return null
        })
    })
  })
