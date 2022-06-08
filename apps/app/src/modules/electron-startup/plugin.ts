import store from '@/store'
import { app } from 'electron'

app.whenReady().then(() => {
  store.getters.isReady().then(() => {
    const { launchOnStartup } = store.getters['settings/persisted']
    console.log('[electron-startup] Launch on startup:', launchOnStartup)
    app.setLoginItemSettings({
      openAtLogin: launchOnStartup,
      path: app.getPath('exe'),
    })
  })
})
