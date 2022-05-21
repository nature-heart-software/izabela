import { ipcMain } from 'electron-postman'
import { app } from 'electron'
import { processes } from '@/types/electron'
import { createNotification } from '@/utils/electron-notification'
import process from 'process'
import store from '@/store'

;(() => {
  // if (process.env.NODE_ENV === 'development') {
  ;(store.state as any)['electron-vuex']
    .ready()
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
      processes.forEach((windowProcess) => {
        ipcMain.on(windowProcess, 'error', (error: Error) => errorHandler(error, windowProcess))
      })
    })
  // }
})()
