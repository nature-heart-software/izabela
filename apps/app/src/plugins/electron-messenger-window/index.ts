import { app } from 'electron'
import { bridge } from '@izabela/electron-bridger'
import ElectronWindowManager, { Instance } from '@/modules/electron-window-manager'

class ElectronMessengerWindow {
  hide() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      window.hide()
    }
    return Promise.resolve()
  }

  show() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      window.show()
    }
    return Promise.resolve()
  }

  openDevTools() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      if (window.webContents.devToolsWebContents && window.webContents.isDevToolsOpened()) {
        window.webContents.devToolsWebContents.focus()
      } else {
        window.webContents.openDevTools()
      }
    }
    return Promise.resolve()
  }

  focus() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      window.setFocusable(true) // Fixes alwaysOnTop going in the background sometimes for some reasons
      window.show() // Fixes focus properly for some reasons
      window.focus() // Fixes issues with Chrome and input elements
      window.setIgnoreMouseEvents(false)
    }
    return Promise.resolve()
  }

  blur() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      window.setFocusable(false) // Fixes alwaysOnTop going in the background sometimes for some reasons
      window.blur() // Fixes issues with Chrome and input elements
      window.setIgnoreMouseEvents(true, { forward: true })
    }
    return Promise.resolve()
  }
}

declare global {
  interface Window {
    ElectronMessengerWindow: ElectronMessengerWindow
  }
}

export default ((): ElectronMessengerWindow => bridge.new(ElectronMessengerWindow)())()
