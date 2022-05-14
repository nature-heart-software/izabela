import { autoUpdater } from 'electron-updater'
import store from '@/store'
;(store.state as any)['electron-vuex'].ready().then(() => {
  const channel = store.getters['settings/persisted'].autoUpdateChannel
  console.log('[electron-updater] Auto update channel:', channel)
  autoUpdater.channel = channel
  autoUpdater.checkForUpdatesAndNotify()
})
