import ElectronWindowManager from '@/modules/electron-window-manager'
import iohook, { IOHookEvent } from '@/modules/iohook'
import store from '@/store'
import { throttle } from 'lodash'
import { Boundary } from '@/modules/vue-dom-boundaries/types'

export const createElectronMessengerWindow = () => {
  /* use isFocused as source of truth instead of window.isFocused() as in some instances
   * window.isFocused() returns true when the window is actually blurred, preventing
   * focus again.
   *  */
  let isFocused = false
  let lastKeypressTime = 0
  const doubleKeypressDelta = 500

  const openDevTools = () =>
    new Promise((resolve) => {
      const instances = ElectronWindowManager.getInstances()
      instances.forEach((instance) => {
        const { window } = instance
        if (window.webContents.devToolsWebContents && window.webContents.isDevToolsOpened()) {
          window.webContents.devToolsWebContents.focus()
        } else {
          window.webContents.openDevTools({ mode: 'undocked' })
        }
      })
      resolve(true)
    })

  const focus = () =>
    new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        const { window } = messenger
        if (!isFocused) {
          isFocused = true
          window.once('show', () => {
            /* The focus needs to be delayed after the show() to actually focus properly... */
            setTimeout(() => {
              isFocused = true
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

  const blur = () =>
    new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        const { window } = messenger
        if (isFocused) {
          isFocused = false
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

  const hide = () =>
    new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        const { window } = messenger
        blur()
          .then(() => {
            window.hide()
          })
          .catch(reject)
      } else {
        reject()
      }
    })

  const show = () =>
    new Promise((resolve, reject) => {
      const messenger = ElectronWindowManager.getInstanceByName('messenger')
      if (messenger) {
        focus()
        resolve(true)
      } else {
        reject()
      }
    })

  const onMouseMove = (event: IOHookEvent) => {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      if (!window.isDestroyed() && window.isVisible()) {
        const { x: mouseX = 0, y: mouseY = 0 } = event
        const [windowX, windowY] = window.getPosition()
        const domBoundaries = store.getters['dom-boundaries/boundaries']
        const isWithinAnyBoundaries = domBoundaries.some(({ x, y, w, h }: Boundary) => {
          const isWithinXBoundaries = mouseX >= windowX + x && mouseX <= windowX + x + w
          const isWithinYBoundaries = mouseY >= windowY + y && mouseY <= windowY + y + h
          return isWithinXBoundaries && isWithinYBoundaries
        })
        if (isWithinAnyBoundaries) {
          focus()
        } else {
          blur()
        }
      }
    }
  }

  const toggleWindow = () => {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const { window } = messenger
      if (window.isVisible()) {
        hide()
      } else {
        focus()
      }
    }
    return Promise.resolve()
  }

  const addEventListeners = () => {
    // iohook.on('keypress', ({ keychar }) => console.log(`Key pressed: ${String.fromCharCode(keychar)}`))
    iohook.on('mousemove', throttle(onMouseMove, 150))
    iohook.on('keyup', (event) => {
      if (event.keycode === 56) {
        let keypressTime = Number(new Date())
        if (keypressTime - lastKeypressTime <= doubleKeypressDelta) {
          toggleWindow()
          keypressTime = 0
        }
        lastKeypressTime = keypressTime
      }
    })
    // iohook.registerShortcut([42, 56], () => {
    //   toggleWindow()
    // })
  }

  const start = () => {
    addEventListeners()
  }

  return {
    openDevTools,
    focus,
    blur,
    show,
    hide,
    toggleWindow,
    start,
  }
}

export default createElectronMessengerWindow()
