import { app, screen } from 'electron'
import store from '@/store'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from '@/utils/vue'

export default () =>
  app.whenReady().then(() =>
    store.getters.isReady().then(() => {
      electronMessengerWindow.setDisplay(store.getters['settings/persisted'].display)

      watch(
        () => store.getters['settings/persisted'].display,
        () => {
          electronMessengerWindow.setDisplay(store.getters['settings/persisted'].display)
        },
      )

      const screenEvents = ['display-added', 'display-removed', 'display-metrics-changed'] as const
      screenEvents.forEach((event) => {
        screen.on(event as any, () => {
          electronMessengerWindow.setDisplay(store.getters['settings/persisted'].display)
        })
      })
    }),
  )
