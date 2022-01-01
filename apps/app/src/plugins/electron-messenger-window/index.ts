import { bridge } from '@izabela/electron-bridger'
import ElectronWindowManager from '@/modules/electron-window-manager'
import iohook from '@/modules/iohook'

class ElectronMessengerWindow {
  doubleKeypressDelta = 500

  lastKeypressTime = 0

  constructor() {
    this.addEventListeners()
  }

  addEventListeners() {
    // iohook.on('keypress', ({ keychar }) => console.log(`Key pressed: ${String.fromCharCode(keychar)}`))

    iohook.on('keydown', (event) => {
      if (event.keycode === 56) {
        let keypressTime = Number(new Date())
        if (keypressTime - this.lastKeypressTime <= this.doubleKeypressDelta) {
          this.toggleWindow()
          // optional - if we'd rather not detect a triple-press
          // as a second double-press, reset the timestamp
          keypressTime = 0
        }
        this.lastKeypressTime = keypressTime
      }
    })
    iohook.registerShortcut([42, 56], (keys: [number, number]) => {
      this.toggleWindow()
      console.log('Shortcut called with keys:', keys)
    })
  }

  toggleWindow() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      console.log(window.isVisible())
      if (window.isVisible()) {
        this.hide()
      } else {
        this.focus()
      }
    }
    return Promise.resolve()
  }

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
