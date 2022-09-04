import store from '@/store'
import { app } from 'electron'
import { watch } from 'vue'

export default () =>
  app.whenReady().then(() =>
    store.getters.isReady().then(() => {
      const setLaunchOnStartup = (launchOnStartup: boolean) => {
        console.log('[electron-startup] Launch on startup:', launchOnStartup)
        app.setLoginItemSettings({
          openAtLogin: launchOnStartup,
          path: app.getPath('exe'),
        })
      }
      setLaunchOnStartup(store.getters['settings/persisted'].launchOnStartup)
      watch(
        () => store.getters['settings/persisted'].launchOnStartup,
        () => {
          setLaunchOnStartup(store.getters['settings/persisted'].launchOnStartup)
        },
      )
    }),
  )
