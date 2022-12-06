import ElectronWindowManager from '@/modules/electron-window-manager'
import iohook, { IOHookEvent } from '@/modules/node-iohook'
import { throttle } from 'lodash'
import { Hitbox } from '@/modules/vue-hitboxes/types'
import { BrowserWindow, screen, shell } from 'electron'
import { useMessengerStore, useMessengerWindowStore } from '@/teams/messenger/store'
import { useSettingsStore } from '@/features/settings/store'
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'
import { Deferred } from '@packages/toolbox'

export const ElectronMessengerWindow = () => {
  /* use isFocused as source of truth instead of window.isFocused() as in some instances
   * window.isFocused() returns true when the window is actually blurred, preventing
   * focus again.
   *  */
  let isFocused = false
  // let lastKeypressTime = 0
  // const doubleKeypressDelta = 500
  let registeredWindow: BrowserWindow | null = null
  let hitboxesStore: ReturnType<typeof useHitboxesStore> | undefined
  let settingsStore: ReturnType<typeof useSettingsStore> | undefined
  let messengerStore: ReturnType<typeof useMessengerStore> | undefined
  let messengerWindowStore: ReturnType<typeof useMessengerWindowStore> | undefined
  const ready = Deferred<BrowserWindow>()
  const isReady = () => ready.promise

  const getWindow = () =>
    registeredWindow || ElectronWindowManager.getInstanceByName('messenger')?.window

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
      const window = getWindow()
      if (window) {
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
      const window = getWindow()
      if (window) {
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
      const window = getWindow()
      if (window) {
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
      const window = getWindow()
      if (window) {
        focus()
        resolve(true)
      } else {
        reject()
      }
    })

  const onMouseMove = (event: IOHookEvent) => {
    if (!hitboxesStore) return
    const window = getWindow()
    if (window) {
      if (!window.isDestroyed() && window.isVisible()) {
        const { x: mouseX = 0, y: mouseY = 0 } = event
        const [windowX, windowY] = window.getPosition()
        const { hitboxes } = hitboxesStore
        const isWithinAnyHitboxes = hitboxes.some(({ x, y, w, h }: Hitbox) => {
          const isWithinXHitbox = mouseX >= windowX + x && mouseX <= windowX + x + w
          const isWithinYHitbox = mouseY >= windowY + y && mouseY <= windowY + y + h
          return isWithinXHitbox && isWithinYHitbox
        })
        if (isWithinAnyHitboxes) {
          focus()
        } else {
          blur()
        }
      }
    }
  }

  const toggleWindow = () => {
    const window = getWindow()
    if (window) {
      if (window.isVisible()) {
        hide()
      } else {
        focus()
      }
    }
    return Promise.resolve()
  }

  const setDisplay = (id?: Electron.Display['id'] | null) => {
    const window = getWindow()
    if (window) {
      const allDisplays = screen.getAllDisplays()
      const primaryDisplay = screen.getPrimaryDisplay()
      const display = allDisplays.find((d) => d.id === id) || primaryDisplay
      window.setBounds(display.bounds)
    }
  }

  const addEventListeners = () => {
    const window = getWindow()
    // iohook.on('keypress', ({ keychar }) => console.log(`Key pressed: ${String.fromCharCode(keychar)}`))
    iohook.on('mousemove', throttle(onMouseMove, 150))
    // iohook.on('keyup', (event) => {
    //   console.log(event)
    // if (event.keycode === 56) {
    //   let keypressTime = Number(new Date())
    //   if (keypressTime - lastKeypressTime <= doubleKeypressDelta) {
    //     toggleWindow()
    //     keypressTime = 0
    //   }
    //   lastKeypressTime = keypressTime
    // }
    // })
    // iohook.registerShortcut([42, 56], () => {
    //   toggleWindow()
    // })

    if (window) {
      window.on('show', () => {
        if (!messengerWindowStore) return
        messengerWindowStore.$patch({ isShown: true })
      })
      window.on('hide', () => {
        if (!messengerWindowStore) return
        messengerWindowStore.$patch({ isShown: false })
      })
      window.on('focus', () => {
        if (!messengerWindowStore) return
        messengerWindowStore.$patch({ isFocused: true })
      })
      window.on('blur', () => {
        if (!messengerWindowStore) return
        messengerWindowStore.$patch({ isFocused: false })
      })
      window.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
      })
    }
  }

  const start = (window: BrowserWindow) => {
    const localSettingsStore = useSettingsStore()
    settingsStore = localSettingsStore
    messengerStore = useMessengerStore()
    messengerWindowStore = useMessengerWindowStore()
    hitboxesStore = useHitboxesStore()
    registeredWindow = window
    settingsStore.$whenReady().then(() => {
      setDisplay(localSettingsStore.display)
    })
    ready.resolve(window)
  }

  isReady().then(() => {
    addEventListeners()
  })

  return {
    openDevTools,
    focus,
    blur,
    show,
    hide,
    toggleWindow,
    start,
    setDisplay,
    isReady,
  }
}

export default ElectronMessengerWindow()
