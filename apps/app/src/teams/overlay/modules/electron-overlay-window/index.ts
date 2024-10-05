import ElectronWindowManager from '@/modules/electron-window-manager'
import throttle from 'lodash/throttle'
import { BrowserWindow, screen } from 'electron'
import { useSettingsStore } from '@/features/settings/store'
import { Deferred } from '@packages/toolbox'
import ffi from 'ffi-napi'
import {
  gkl,
  keybindingAllReleased,
  keybindingTriggered,
} from '@/modules/electron-keybinding/utils'
import { IGlobalKeyEvent, IGlobalKeyListener } from 'node-global-key-listener'
import {
  emitIPCOverlayInputCharacter,
  emitIPCOverlayInputCommand,
} from '@/electron/events/main'
import keymap from '@packages/native-keymap'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { useOverlayWindowStore } from '@/teams/overlay/store'

export const ElectronOverlayWindow = () => {
  let waitingToShow = false
  let registeredWindow: BrowserWindow | null = null
  let settingsStore: ReturnType<typeof useSettingsStore> | undefined
  let overlayWindowStore: ReturnType<typeof useOverlayWindowStore> | undefined
  const ready = Deferred<BrowserWindow>()
  const isReady = () => ready.promise

  const user32 = new ffi.Library('user32', {
    BlockInput: ['bool', ['bool']],
  })

  const getWindow = () =>
    registeredWindow ||
    ElectronWindowManager.getInstanceByName('messenger')?.window

  const hide = () =>
    new Promise((resolve, reject) => {
      const window = getWindow()
      if (window) {
        window.hide()
        gkl?.removeListener(toggleOverlayWindowListener)
        setTimeout(() => {
          user32.BlockInput(false)
        }, 100)
        resolve(true)
      } else {
        reject()
      }
    })

  const show = () =>
    new Promise((resolve, reject) => {
      const window = getWindow()
      if (window) {
        new Promise((r) => {
          const callback = () => {
            if (
              settingsStore &&
              keybindingAllReleased(
                settingsStore.keybindings.toggleOverlayWindow,
              )
            ) {
              gkl?.removeListener(callback)
              r(true)
            }
          }
          gkl?.addListener(callback)
        })
          .then(() => {
            gkl?.addListener(toggleOverlayWindowListener)
            setTimeout(() => {
              user32.BlockInput(true)
            }, 100)
            window.showInactive()
            waitingToShow = false
            resolve(true)
          })
          .catch(() => reject())
      } else {
        reject()
      }
    })

  const toggleWindow = throttle(() => {
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

  function toggleOverlayWindowListener(e: Parameters<IGlobalKeyListener>[0]) {
    if (settingsStore) {
      if (keybindingTriggered(settingsStore.keybindings.toggleOverlayWindow)) {
        toggleWindow()
      }
    }
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
    gkl?.addListener((e: IGlobalKeyEvent, down) => {
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
            (k: any) => k.vkey === e.rawKey._nameRaw,
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
    })

    if (window) {
      window.on('show', () => {
        if (!overlayWindowStore) return
        overlayWindowStore.$patch({ isShown: true })
      })
      window.on('hide', () => {
        if (!overlayWindowStore) return
        overlayWindowStore.$patch({ isShown: false })
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
  }

  isReady().then(() => {
    addEventListeners()
  })

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
