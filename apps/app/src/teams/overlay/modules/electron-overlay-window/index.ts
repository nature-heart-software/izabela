import ElectronWindowManager from '@/modules/electron-window-manager'
import { throttle } from 'lodash'
import { BrowserWindow, screen } from 'electron'
import { useSettingsStore } from '@/features/settings/store'
import { Deferred } from '@packages/toolbox'
import ffi from 'ffi-napi'

export const ElectronOverlayWindow = () => {
  let registeredWindow: BrowserWindow | null = null
  let settingsStore: ReturnType<typeof useSettingsStore> | undefined
  const ready = Deferred<BrowserWindow>()
  const isReady = () => ready.promise

  const user32 = new ffi.Library('user32', {
    BlockInput: ['bool', ['bool']],
  })

  const getWindow = () =>
    registeredWindow || ElectronWindowManager.getInstanceByName('messenger')?.window

  const hide = () =>
    new Promise((resolve, reject) => {
      const window = getWindow()
      if (window) {
        window.hide()
        user32.BlockInput(false)
        resolve(true)
      } else {
        reject()
      }
    })

  const show = () =>
    new Promise((resolve, reject) => {
      const window = getWindow()
      if (window) {
        user32.BlockInput(true)
        window.showInactive()
        resolve(true)
      } else {
        reject()
      }
    })

  const toggleWindow = throttle(() => {
    const window = getWindow()
    if (window) {
      if (window.isVisible()) {
        hide()
      } else {
        show()
      }
    }
    return Promise.resolve()
  }, 500)

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

  const addEventListeners = () => {}

  const start = (window: BrowserWindow) => {
    const localSettingsStore = useSettingsStore()
    settingsStore = localSettingsStore
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
