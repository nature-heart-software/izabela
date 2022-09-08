import store from '@/store'
import { app } from 'electron'
import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

export default () =>
  app.whenReady().then(() =>
    store.getters.isReady().then(() => {
      const settingsStore = useSettingsStore()
      const setLaunchOnStartup = (launchOnStartup: boolean) => {
        console.log('[electron-startup] Launch on startup:', launchOnStartup)
        app.setLoginItemSettings({
          openAtLogin: launchOnStartup,
          path: app.getPath('exe'),
        })
      }
      setLaunchOnStartup(settingsStore.launchOnStartup)
      watch(
        () => settingsStore.launchOnStartup,
        () => {
          setLaunchOnStartup(settingsStore.launchOnStartup)
        },
      )
    }),
  )
