import store from '@/store'
import { app } from 'electron'

export default () =>
  app.whenReady().then(() =>
    store.getters.isReady().then(() => {
      const { launchOnStartup } = store.getters['settings/persisted']
      console.log('[electron-update] Launch on update:', launchOnStartup)
      app.setLoginItemSettings({
        openAtLogin: launchOnStartup,
        path: app.getPath('exe'),
      })
    }),
  )
