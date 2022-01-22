import { bridge } from '@izabela/electron-bridger'
import ElectronWindowManager from '@/modules/electron-window-manager'
import iohook, { IOHookEvent } from '@/modules/iohook'
import store from '@/store'
import { throttle } from 'lodash'

class ElectronMessengerWindow {
  /* use isFocused as source of truth instead of window.isFocused() as in some instances
   * window.isFocused() returns true when the window is actually blurred, preventing
   * focus again.
   *  */
  isFocused = false

  doubleKeypressDelta = 500

  lastKeypressTime = 0

  constructor() {
    this.addEventListeners()
  }

  onMouseMove(event: IOHookEvent) {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      if (window.isVisible()) {
        const { x: mouseX = 0, y: mouseY = 0 } = event
        const [windowX, windowY] = window.getPosition()
        const {
          translate: [focusableX, focusableY],
          width: focusableWidth,
          height: focusableHeight,
        } = store.getters['messenger/persisted'].position
        const isWithinXBoundaries =
          mouseX >= windowX + focusableX && mouseX <= windowX + focusableX + focusableWidth
        const isWithinYBoundaries =
          mouseY >= windowY + focusableY && mouseY <= windowY + focusableY + focusableHeight
        if (isWithinXBoundaries && isWithinYBoundaries) {
          this.focus()
        } else {
          this.blur()
        }
      }
    }
  }

  addEventListeners() {
    // iohook.on('keypress', ({ keychar }) => console.log(`Key pressed: ${String.fromCharCode(keychar)}`))
    iohook.on('mousemove', throttle(this.onMouseMove.bind(this), 150))
    iohook.on('keydown', (event) => {
      if (event.keycode === 56) {
        let keypressTime = Number(new Date())
        if (keypressTime - this.lastKeypressTime <= this.doubleKeypressDelta) {
          this.toggleWindow()
          keypressTime = 0
        }
        this.lastKeypressTime = keypressTime
      }
    })
    iohook.registerShortcut([42, 56], () => {
      this.toggleWindow()
    })
  }

  toggleWindow() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      if (window.isVisible()) {
        this.hide()
      } else {
        this.focus()
      }
    }
    return Promise.resolve()
  }

  hide() {
    return new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        const { window } = messenger
        this.blur()
          .then(() => {
            window.hide()
          })
          .catch(reject)
      } else {
        reject()
      }
    })
  }

  show() {
    return new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        this.focus()
        resolve(true)
      } else {
        reject()
      }
    })
  }

  openDevTools() {
    return new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        const { window } = messenger
        if (window.webContents.devToolsWebContents && window.webContents.isDevToolsOpened()) {
          window.webContents.devToolsWebContents.focus()
        } else {
          window.webContents.openDevTools()
        }
        resolve(true)
      } else {
        reject()
      }
    })
  }

  focus() {
    return new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        const { window } = messenger
        if (!this.isFocused) {
          this.isFocused = true
          window.once('show', () => {
            /* The focus needs to be delayed after the show() to actually focus properly... */
            setTimeout(() => {
              this.isFocused = true
              window.focus() // Fixes issues with Chrome and input elements
              resolve(true)
            }, 250)
          })

          /* order matters */
          window.setFocusable(true) // Fixes alwaysOnTop going in the background sometimes for some reasons
          window.setIgnoreMouseEvents(false)
          window.show() // Fixes focus properly with Hardware Acceleration for some reasons
          window.focus() // needed for immediate focus in case the window is already shown
        }
      } else {
        reject()
      }
    })
  }

  blur() {
    return new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        const { window } = messenger
        if (this.isFocused) {
          this.isFocused = false
          /* order matters */
          window.blur() // Fixes issues with Chrome and input elements
          window.setIgnoreMouseEvents(true)
          window.setFocusable(false) // Fixes alwaysOnTop going in the background sometimes for some reasons
        }
        resolve(true)
      } else {
        reject()
      }
    })
  }
}

declare global {
  interface Window {
    ElectronMessengerWindow: ElectronMessengerWindow
  }
}

export default ((): ElectronMessengerWindow => bridge.new(ElectronMessengerWindow)())()
