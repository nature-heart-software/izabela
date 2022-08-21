import { app } from 'electron'
import { createNotification } from '@/utils/electron-notification'
import process from 'process'
import store from '@/store'
import { onIPCProcessError } from '@/electron/events/main'

export default () =>
  app.whenReady().then(() =>
    store.getters
      .isReady()
      .then(app.whenReady)
      .then(() => {
        const errorHandler = (error: Error, windowProcess = 'main') => {
          if (store.getters['settings/persisted'].debugMode) {
            createNotification({
              title: `[${windowProcess}] ${error.name}`,
              body: error.message,
              silent: true,
            }).show()
          }
        }
        process.on('uncaughtException', errorHandler)
        onIPCProcessError((error: Error, processName) => errorHandler(error, processName))
      }),
  )
