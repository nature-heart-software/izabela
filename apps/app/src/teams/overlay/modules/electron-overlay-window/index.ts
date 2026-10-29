import ElectronWindowManager from '@/modules/electron-window-manager'
import throttle from 'lodash/throttle'
import { BrowserWindow, screen } from 'electron'
import { useSettingsStore } from '@/features/settings/store'
import { Deferred } from '@packages/toolbox'
import {
  gkl,
  keybindingAllReleased,
  keybindingTriggered,
} from '@/modules/electron-keybinding/utils'
import { IGlobalKeyListener } from 'node-global-key-listener'
import {
  emitIPCOverlayInputCharacter,
  emitIPCOverlayInputCommand,
} from '@/electron/events/main'
import keymap from '@packages/native-keymap'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { useOverlayWindowStore } from '@/teams/overlay/store'
import koffi from 'koffi'
import { findDisplay } from '@/features/display/utils'

export const ElectronOverlayWindow = () => {
  let waitingToShow = false
  let registeredWindow: BrowserWindow | null = null
  let settingsStore: ReturnType<typeof useSettingsStore> | undefined
  let overlayWindowStore: ReturnType<typeof useOverlayWindowStore> | undefined
  let ready = Deferred<BrowserWindow>()
  const isReady = () => {
    const window = getWindow()
    return window ? Promise.resolve(window) : ready.promise
  }
  let cancelPendingShow: (() => void) | undefined
  let blockInputTimer: ReturnType<typeof setTimeout> | undefined
  let showGeneration = 0

  const user32 = koffi.load('user32.dll')

  const user32Api = {
    BlockInput: user32.func('int BlockInput(int fBlockIt)'),
  }

  const getWindow = () => {
    const window =
      registeredWindow ||
      ElectronWindowManager.getInstanceByName('overlay')?.window
    return window && !window.isDestroyed() ? window : undefined
  }

  const releaseInput = () => {
    showGeneration++
    cancelPendingShow?.()
    cancelPendingShow = undefined
    clearTimeout(blockInputTimer)
    gkl?.removeListener(toggleOverlayWindowListener)
    user32Api.BlockInput(0)
    waitingToShow = false
  }

  const hide = async () => {
    releaseInput()
    const window = getWindow()
    window?.hide()
    return !!window
  }

  const show = async () => {
    const window = getWindow()
    if (!window || !settingsStore?.enableOverlayWindow) return false
    releaseInput()
    const generation = showGeneration
    waitingToShow = true
    const released = await new Promise<boolean>((resolve) => {
      const callback = () => {
        if (
          settingsStore &&
          keybindingAllReleased(settingsStore.keybindings.toggleOverlayWindow)
        ) {
          gkl?.removeListener(callback)
          cancelPendingShow = undefined
          resolve(true)
        }
      }
      cancelPendingShow = () => {
        gkl?.removeListener(callback)
        resolve(false)
      }
      gkl?.addListener(callback)
      callback()
    })
    if (
      !released ||
      generation !== showGeneration ||
      window !== getWindow() ||
      !settingsStore.enableOverlayWindow
    )
      return false
    gkl?.addListener(toggleOverlayWindowListener)
    window.showInactive()
    waitingToShow = false
    blockInputTimer = setTimeout(() => {
      if (
        generation === showGeneration &&
        window === getWindow() &&
        window.isVisible() &&
        settingsStore?.enableOverlayWindow
      )
        user32Api.BlockInput(1)
    }, 100)
    return true
  }

  const toggleWindow = throttle(() => {
    if (!settingsStore?.enableOverlayWindow) return Promise.resolve()
    electronMessengerWindow.hide(false)
    const window = getWindow()
    if (window) {
      if (window.isVisible()) {
        hide()
      } else if (!waitingToShow) {
        waitingToShow = true
        show()
      }
    }
    return Promise.resolve()
  }, 250)

  function toggleOverlayWindowListener() {
    if (settingsStore) {
      if (keybindingTriggered(settingsStore.keybindings.toggleOverlayWindow)) {
        toggleWindow()
      }
    }
  }

  const setDisplay = (
    id?: Electron.Display['id'] | null,
    boundsHint?: Electron.Rectangle | null,
  ) => {
    const window = getWindow()
    if (window) {
      const allDisplays = screen.getAllDisplays()
      const primaryDisplay = screen.getPrimaryDisplay()
      const display = findDisplay(allDisplays, id, boundsHint) || primaryDisplay
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
    const onKey: IGlobalKeyListener = (e, down) => {
      if (
        settingsStore &&
        !keybindingTriggered(settingsStore.keybindings.toggleOverlayWindow) &&
        window?.isVisible()
      ) {
        if (
          e.state === 'DOWN' &&
          !((down['LEFT CTRL'] && !down['RIGHT ALT']) || down['RIGHT CTRL']) &&
          e.name !== 'SPACE'
        ) {
          const nativeKey = Object.values(keymap.getKeyMap()).find(
            (k: any) => k.vkey === e.rawKey?._nameRaw,
          )
          if (nativeKey) {
            const hasShift = down['LEFT SHIFT'] || down['RIGHT SHIFT']
            const hasRightAlt = down['RIGHT ALT']
            const key =
              hasRightAlt && hasShift
                ? nativeKey.withShiftAltGr
                : hasRightAlt
                ? nativeKey.withAltGr
                : hasShift
                ? nativeKey.withShift
                : nativeKey.value
            if (key) {
              emitIPCOverlayInputCharacter(key)
            }
          }
        }
        if (e.state === 'DOWN' && e.name === 'ESCAPE') {
          hide()
        }
        if (e.state === 'DOWN' && e.name === 'BACKSPACE') {
          emitIPCOverlayInputCommand('delete')
        }
        if (e.state === 'DOWN' && e.name === 'DELETE') {
          emitIPCOverlayInputCommand('suppr')
        }
        if (e.state === 'DOWN' && e.name === 'SPACE') {
          emitIPCOverlayInputCommand('spaceLetter')
        }
        if (e.state === 'DOWN' && e.name === 'RETURN') {
          emitIPCOverlayInputCommand('validateMessage')
        }
        if (
          e.state === 'DOWN' &&
          e.name === 'A' &&
          (down['LEFT CTRL'] || down['RIGHT CTRL'])
        ) {
          emitIPCOverlayInputCommand('selectAll')
        }
        if (
          e.state === 'DOWN' &&
          e.name === 'X' &&
          (down['LEFT CTRL'] || down['RIGHT CTRL'])
        ) {
          emitIPCOverlayInputCommand('cut')
        }
        if (
          e.state === 'DOWN' &&
          e.name === 'C' &&
          (down['LEFT CTRL'] || down['RIGHT CTRL'])
        ) {
          emitIPCOverlayInputCommand('copy')
        }
        if (
          e.state === 'DOWN' &&
          e.name === 'V' &&
          (down['LEFT CTRL'] || down['RIGHT CTRL'])
        ) {
          emitIPCOverlayInputCommand('paste')
        }
        if (e.state === 'DOWN' && e.name === 'LEFT ARROW') {
          if (down['LEFT SHIFT'] || down['RIGHT SHIFT']) {
            emitIPCOverlayInputCommand('moveSelectionLeft')
          } else {
            emitIPCOverlayInputCommand('moveCaretLeft')
          }
        }
        if (e.state === 'DOWN' && e.name === 'RIGHT ARROW') {
          if (down['LEFT SHIFT'] || down['RIGHT SHIFT']) {
            emitIPCOverlayInputCommand('moveSelectionRight')
          } else {
            emitIPCOverlayInputCommand('moveCaretRight')
          }
        }
      }
    }
    gkl?.addListener(onKey)

    if (window) {
      window.on('show', () => {
        if (!overlayWindowStore) return
        overlayWindowStore.$patch({ isShown: true })
      })
      window.on('hide', () => {
        if (!overlayWindowStore) return
        overlayWindowStore.$patch({ isShown: false })
      })
      window.once('closed', () => {
        gkl?.removeListener(onKey)
        if (registeredWindow === window) {
          releaseInput()
          registeredWindow = null
          overlayWindowStore?.$patch({ isShown: false })
          ready = Deferred<BrowserWindow>()
        }
      })
    }
  }

  const start = (window: BrowserWindow) => {
    const localSettingsStore = useSettingsStore()
    settingsStore = localSettingsStore
    overlayWindowStore = useOverlayWindowStore()
    registeredWindow = window
    settingsStore.$whenReady().then(() => {
      setDisplay(localSettingsStore.display)
    })
    ready.resolve(window)
    addEventListeners()
  }

  return {
    show,
    hide,
    toggleWindow,
    start,
    setDisplay,
    isReady,
    zoomIn,
    zoomOut,
    resetZoom,
  }
}

export default ElectronOverlayWindow()
