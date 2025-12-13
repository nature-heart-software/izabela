import ElectronWindowManager from '@/modules/electron-window-manager'
import { startMouse, stopMouse } from '@/modules/node-mouse'
import throttle from 'lodash/throttle'
import { Hitbox } from '@/modules/vue-hitboxes/types'
import { app, BrowserWindow, screen, shell } from 'electron'

import {
  useMessengerStore,
  useMessengerWindowStore,
} from '@/teams/messenger/store'
import { useSettingsStore } from '@/features/settings/store'
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'
import { Deferred } from '@packages/toolbox'
import { getNativeWindowHandleInt } from '@/utils/electron-window'
import gameOverlay from '@/electron/game-overlay.ts'
import { focusWindow } from 'forcefocus'
import koffi from 'koffi'

export const ElectronMessengerWindow = () => {
  /* use isFocused as source of truth instead of window.isFocused() as in some instances
   * window.isFocused() returns true when the window is actually blurred, preventing
   * focus again.
   *  */
  let isFocused = false
  // let lastKeypressTime = 0
  // const doubleKeypressDelta = 500
  let registeredWindow: BrowserWindow | null = null
  let WinControl: any | null = null
  let hitboxesStore: ReturnType<typeof useHitboxesStore> | undefined
  let settingsStore: ReturnType<typeof useSettingsStore> | undefined
  let messengerStore: ReturnType<typeof useMessengerStore> | undefined
  let messengerWindowStore:
    | ReturnType<typeof useMessengerWindowStore>
    | undefined
  const ready = Deferred<BrowserWindow>()
  const isReady = () => ready.promise
  let foregroundWindow: string | number | null = null

  const user32 = koffi.load('user32.dll')

  const user32Api = {
    SetForegroundWindow: user32.func('bool SetForegroundWindow(void* hWnd)'),
    GetForegroundWindow: user32.func('void* GetForegroundWindow()'),
  }

  const getWindow = () =>
    registeredWindow ||
    ElectronWindowManager.getInstanceByName('messenger')?.window

  const openDevTools = () =>
    new Promise((resolve) => {
      const instances = ElectronWindowManager.getInstances()
      instances.forEach((instance) => {
        const { window } = instance
        if (
          window.webContents.devToolsWebContents &&
          window.webContents.isDevToolsOpened()
        ) {
          window.webContents.devToolsWebContents.focus()
        } else {
          setTimeout(() => {
            window.webContents.openDevTools({ mode: 'undocked' })
          }, 300)
        }
      })
      resolve(true)
    })

  const ensureNativeFocus = () => {
    const window = getWindow()
    if (window) {
      focusWindow(window)
    }
  }

  const focus = (context: 'mouse' | 'keyboard', native = false) =>
    new Promise((_, reject) => {
      const foregroundWindowPid = WinControl?.getForeground()?.getPid()
      const isProcessHooked = gameOverlay.isProcessHooked(foregroundWindowPid)
      if (isProcessHooked && !gameOverlay.intercepting) {
        gameOverlay.startIntercept()
        return
      }
      messengerWindowStore?.$patch({ focusContext: context })
      const window = getWindow()
      if (window) {
        if (!isFocused) {
          if (native) {
            // Need to call ensureNativeFocus as late as possible otherwise it can break the foreground window
            window.once('focus', () => {
              // The first time ensureNative is called after the app is alseep,
              // it has a chance to close the window right away and sometimes
              // can cause softlock of the system in rare occasions
              // so we need to time it out as late as possible.
              setTimeout(ensureNativeFocus, 200)
            })
          }
          foregroundWindow = user32Api.GetForegroundWindow()
          // to prevent shenanigans with some softwares (*coughs* League of Legends *coughs*)
          // this makes sure to blur first with ffi-napi for safe measures
          user32Api.SetForegroundWindow(0)
          isFocused = true

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

  const blur = (returnFocus = true) =>
    new Promise((resolve, reject) => {
      const window = getWindow()
      if (window) {
        if (isFocused) {
          const windowNativeHandle = getNativeWindowHandleInt(window)
          isFocused = false
          /* order matters */
          window.blur() // Fixes issues with Chrome and input elements
          window.setIgnoreMouseEvents(true)
          window.setFocusable(false) // Fixes alwaysOnTop going in the background sometimes for some reasons
          if (foregroundWindow) {
            if (foregroundWindow !== windowNativeHandle && returnFocus) {
              user32Api.SetForegroundWindow(foregroundWindow)
            }
            foregroundWindow = null
          }
        }
        resolve(true)
      } else {
        reject()
      }
    })

  const hide = (returnFocus?: boolean) =>
    new Promise((resolve, reject) => {
      const foregroundWindowPid = WinControl?.getForeground()?.getPid()
      const isProcessHooked = gameOverlay.isProcessHooked(foregroundWindowPid)
      if (isProcessHooked && gameOverlay.intercepting) {
        gameOverlay.stopIntercept()
        return
      }
      const window = getWindow()
      if (window) {
        blur(returnFocus)
          .then(() => {
            window.hide()
            resolve(true)
          })
          .catch(reject)
      } else {
        reject()
      }
    })

  const show = () =>
    new Promise((resolve) => {
      const window = getWindow()
      if (window) {
        focus('mouse')
        resolve(true)
      } else {
        resolve(false)
      }
    })

  const onMouseMove = (initialMouseX = 0, initialMouseY = 0) => {
    if (!hitboxesStore) return
    const window = getWindow()
    if (window) {
      if (!window.isDestroyed() && window.isVisible()) {
        const [windowX, windowY] = window.getPosition()
        const { hitboxes } = hitboxesStore
        const isWithinAnyHitboxes = hitboxes
          .filter(({ w, h }) => w && h)
          .some((hitbox: Hitbox) => {
            const { x: mouseX, y: mouseY } = screen.screenToDipPoint({
              x: initialMouseX,
              y: initialMouseY,
            })
            const scaleFactor = screen.getDisplayNearestPoint({
              x: mouseX,
              y: mouseY,
            }).scaleFactor
            const x1 = hitbox.x / scaleFactor
            const y1 = hitbox.y / scaleFactor
            const x2 = (hitbox.x + hitbox.w) / scaleFactor
            const y2 = (hitbox.y + hitbox.h) / scaleFactor

            const isWithinXHitbox =
              mouseX >= windowX + x1 && mouseX <= windowX + x2
            const isWithinYHitbox =
              mouseY >= windowY + y1 && mouseY <= windowY + y2
            // console.log(isWithinXHitbox && isWithinYHitbox, mouseX, mouseY, {
            //   x1,
            //   y1,
            //   x2,
            //   y2,
            // })
            return isWithinXHitbox && isWithinYHitbox
          })
        if (isWithinAnyHitboxes) {
          focus('mouse')
        } else {
          blur()
        }
      }
    }
  }

  const toggleWindow = throttle(
    (context: 'mouse' | 'keyboard', native = false) => {
      const foregroundWindowPid = WinControl?.getForeground()?.getPid()
      const isProcessHooked = gameOverlay.isProcessHooked(foregroundWindowPid)
      if (isProcessHooked && !gameOverlay.intercepting) {
        gameOverlay.startIntercept()
        return
      }
      if (isProcessHooked && gameOverlay.intercepting) {
        gameOverlay.stopIntercept()
        return
      }
      const window = getWindow()
      if (window) {
        if (window.isVisible()) {
          hide()
        } else {
          focus(context, native)
        }
      }
      return Promise.resolve()
    },
    250,
  )

  const setDisplay = (id?: Electron.Display['id'] | null) => {
    const window = getWindow()
    if (window) {
      const allDisplays = screen.getAllDisplays()
      const primaryDisplay = screen.getPrimaryDisplay()
      const display = allDisplays.find((d) => d.id === id) || primaryDisplay
      window.setBounds(display.bounds)
    }
  }
  const zoomIn = () => {
    const window = getWindow()
    if (!window) return
    window.webContents.zoomLevel += 0.5
  }

  const zoomOut = () => {
    const window = getWindow()
    if (!window) return
    window.webContents.zoomLevel -= 0.5
  }

  const resetZoom = () => {
    const window = getWindow()
    if (!window) return
    window.webContents.zoomLevel = 0
  }

  const addEventListeners = () => {
    const window = getWindow()
    let mouseInstanceId: string | null = null

    function initMouseInstance() {
      if (mouseInstanceId) return
      mouseInstanceId = startMouse('move', onMouseMove)
    }

    function clearMouseInstance() {
      if (mouseInstanceId) stopMouse(mouseInstanceId)
      mouseInstanceId = null
    }

    if (window) {
      window.on('show', () => {
        if (!messengerWindowStore) return
        messengerWindowStore.$patch({ isShown: true })
        initMouseInstance()
      })
      window.on('hide', () => {
        if (!messengerWindowStore) return
        messengerWindowStore.$patch({ isShown: false })
        clearMouseInstance()
      })
      window.on('focus', () => {
        if (!messengerWindowStore) return
        messengerWindowStore.$patch({ isFocused: true })
      })
      window.on('blur', () => {
        if (!messengerWindowStore) return
        messengerWindowStore.$patch({ isFocused: false })
      })
      window.on('close', (e) => {
        e.preventDefault()
        hide()
      })
      window.on('minimize', () => {
        hide()
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
    WinControl = require('win-control').Window
  }

  isReady().then(() => {
    addEventListeners()
  })

  const restart = () => {
    app.relaunch()
    app.exit()
  }

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
    ensureNativeFocus,
    zoomIn,
    zoomOut,
    resetZoom,
    restart,
  }
}

export default ElectronMessengerWindow()
