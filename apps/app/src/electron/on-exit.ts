// this needs to work in main and preload
export const onExit = (callback: () => void) => {
  const { app } = require('electron')

  process?.on('message', (data) => {
    if (process.platform === 'win32' && data === 'graceful-exit') {
      callback()
    }
  })

  ;['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP', 'SIGBREAK', 'beforeExit', 'exit'].forEach((signal) => {
    process?.on(signal, () => {
      callback()
    })
  })

  app?.on('before-quit', () => {
    callback()
  })

  app?.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      callback()
    }
  })
}
