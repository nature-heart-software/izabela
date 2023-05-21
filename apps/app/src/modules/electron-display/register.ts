import { app, screen } from 'electron'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import electronSpeechWorkerWindow from '@/teams/speech-worker/modules/electron-speech-worker-window'

export default () =>
  app.whenReady().then(() => {
    const settingsStore = useSettingsStore()
    electronMessengerWindow.isReady().then(() => {
      electronMessengerWindow.setDisplay(settingsStore.display)
      electronSpeechWorkerWindow.setDisplay()
    })

    watch(
      () => settingsStore.display,
      () => {
        electronMessengerWindow.setDisplay(settingsStore.display)
        electronSpeechWorkerWindow.setDisplay()
      },
    )

    const screenEvents = ['display-added', 'display-removed', 'display-metrics-changed'] as const
    screenEvents.forEach((event) => {
      screen.on(event as any, () => {
        electronMessengerWindow.setDisplay(settingsStore.display)
        electronSpeechWorkerWindow.setDisplay()
      })
    })
  })
