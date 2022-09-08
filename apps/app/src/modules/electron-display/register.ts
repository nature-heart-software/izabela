import { app, screen } from 'electron'
import store from '@/store'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

export default () =>
  app.whenReady().then(() =>
    store.getters.isReady().then(() => {
      const settingsStore = useSettingsStore()
      electronMessengerWindow.isReady().then(() => {
        electronMessengerWindow.setDisplay(settingsStore.display)
      })

      watch(
        () => settingsStore.display,
        () => {
          electronMessengerWindow.setDisplay(settingsStore.display)
        },
      )

      const screenEvents = ['display-added', 'display-removed', 'display-metrics-changed'] as const
      screenEvents.forEach((event) => {
        screen.on(event as any, () => {
          electronMessengerWindow.setDisplay(settingsStore.display)
        })
      })
    }),
  )
