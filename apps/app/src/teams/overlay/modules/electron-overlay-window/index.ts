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
import { Buffer } from 'node:buffer'
import koffi from 'koffi'
import { findDisplay } from '@/features/display/utils'

const INPUT_CONTEXT_CHECK_MS = 100
const INPUT_INACTIVITY_MS = 12_000

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
  let inputContextTimer: ReturnType<typeof setTimeout> | undefined
  let inactivityTimer: ReturnType<typeof setTimeout> | undefined
  let inputForeground: bigint | null = null
  let inputBlocked = false
  let showGeneration = 0

  const user32 = koffi.load('user32.dll')

  const user32Api = {
    BlockInput: user32.func('int __stdcall BlockInput(int fBlockIt)'),
    GetForegroundWindow: user32.func('void * __stdcall GetForegroundWindow()'),
    GetThreadDesktop: user32.func(
      'void * __stdcall GetThreadDesktop(uint32_t threadId)',
    ),
    GetUserObjectInformation: user32.func(
      'int __stdcall GetUserObjectInformationW(void *object, int index, void *data, uint32_t size, void *needed)',
    ),
  }
  const getCurrentThreadId = koffi
    .load('kernel32.dll')
    .func('uint32_t __stdcall GetCurrentThreadId()')
  const receivesInput = Buffer.alloc(4)
  const bytesNeeded = Buffer.alloc(4)
  const getInputForeground = () => {
    const desktop = user32Api.GetThreadDesktop(getCurrentThreadId())
    const UOI_IO = 6
    if (
      !desktop ||
      !user32Api.GetUserObjectInformation(
        desktop,
        UOI_IO,
        receivesInput,
        receivesInput.length,
        bytesNeeded,
      ) ||
      !receivesInput.readInt32LE()
    ) {
      return null
    }
    const foreground = user32Api.GetForegroundWindow()
    return foreground ? koffi.address(foreground) : null
  }

  const getWindow = () => {
    const window =
      registeredWindow ||
      ElectronWindowManager.getInstanceByName('overlay')?.window
    return window && !window.isDestroyed() ? window : undefined
  }

  const releaseInput = (delayUnblock = false) => {
    showGeneration++
    cancelPendingShow?.()
    cancelPendingShow = undefined
    clearTimeout(blockInputTimer)
    clearTimeout(inputContextTimer)
    clearTimeout(inactivityTimer)
    inputForeground = null
    inputBlocked = false
    gkl?.removeListener(toggleOverlayWindowListener)
    if (delayUnblock) {
      const generation = showGeneration
      // Enter submits on key-down. Preserve the historical 100 ms grace period
      // so its remaining key events do not leak into the game and open chat.
      // This is input suppression, not an animation delay; do not remove it.
      blockInputTimer = setTimeout(() => {
        if (generation === showGeneration) user32Api.BlockInput(0)
      }, 100)
    } else {
      user32Api.BlockInput(0)
    }
    waitingToShow = false
  }

  const hide = async () => {
    const window = getWindow()
    releaseInput(!!window)
    window?.hide()
    return !!window
  }

  const dismissAndRelease = (window: BrowserWindow) => {
    // Release on the thread that acquired the block. Hiding keeps the renderer
    // and its draft alive without running the submit command.
    releaseInput()
    window.hide()
  }

  const checkInputContext = (window: BrowserWindow) => {
    // Secure desktop switches change UOI_IO. A prompt on the normal desktop
    // can take the foreground while this non-focusing overlay stays visible.
    if (
      inputForeground !== null &&
      inputForeground === getInputForeground() &&
      settingsStore?.enableOverlayWindow &&
      window.isVisible()
    ) {
      return true
    }
    dismissAndRelease(window)
    return false
  }

  const armInactivityRelease = (window: BrowserWindow) => {
    clearTimeout(inactivityTimer)
    const generation = showGeneration
    inactivityTimer = setTimeout(() => {
      if (generation === showGeneration) dismissAndRelease(window)
    }, INPUT_INACTIVITY_MS)
  }

  const show = async () => {
    const window = getWindow()
    if (!window || !settingsStore?.enableOverlayWindow || !gkl) return false
    releaseInput()
    const foreground = getInputForeground()
    if (foreground === null) return false
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
    waitingToShow = false
    if (foreground !== getInputForeground()) return false
    inputForeground = foreground
    gkl.addListener(toggleOverlayWindowListener)
    window.showInactive()
    blockInputTimer = setTimeout(() => {
      if (generation !== showGeneration || window !== getWindow()) return
      if (!checkInputContext(window)) return
      inputBlocked = Boolean(user32Api.BlockInput(1))
      if (inputBlocked) armInactivityRelease(window)

      const watchInputContext = () => {
        if (generation !== showGeneration || window !== getWindow()) return
        if (checkInputContext(window)) {
          inputContextTimer = setTimeout(
            watchInputContext,
            INPUT_CONTEXT_CHECK_MS,
          )
        }
      }
      inputContextTimer = setTimeout(watchInputContext, INPUT_CONTEXT_CHECK_MS)
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
        window &&
        window === getWindow() &&
        settingsStore &&
        !keybindingTriggered(settingsStore.keybindings.toggleOverlayWindow) &&
        window.isVisible() &&
        checkInputContext(window)
      ) {
        if (inputBlocked && e.state === 'DOWN') armInactivityRelease(window)
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
        if (registeredWindow === window && inputForeground !== null)
          releaseInput()
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
      setDisplay(localSettingsStore.display, localSettingsStore.displayBounds)
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
