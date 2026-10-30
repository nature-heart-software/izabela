import legacy from '@/electron/game-overlay'
import experimental from '@/electron/experimental-game-overlay'
import { useGameOverlayStore } from '@/features/game-overlay/store'

let selected: typeof legacy | typeof experimental | undefined
let experimentalSelected = false
let quitting = false
let failed = false
let startup: Promise<void> | undefined

// Freeze the backend for this application run: switching an injected runtime
// requires a restart, never an automatic fallback or a second injector.
function choose() {
  if (!selected) {
    experimentalSelected = useGameOverlayStore().enableExperimentalGameOverlay
    selected = experimentalSelected ? experimental : legacy
  }
  return selected
}

const gameOverlay = {
  get isExperimental() {
    return selected
      ? experimentalSelected
      : useGameOverlayStore().enableExperimentalGameOverlay
  },
  get enabled() {
    if (quitting || failed) return false
    const store = useGameOverlayStore()
    return (
      selected ? experimentalSelected : store.enableExperimentalGameOverlay
    )
      ? store.enableExperimentalGameOverlay
      : store.enableGameOverlay && !store.enableExperimentalGameOverlay
  },
  get intercepting() {
    return gameOverlay.enabled && !!selected?.intercepting
  },
  start() {
    if (!startup) {
      startup = (async () => {
        await useGameOverlayStore().$whenReady()
        if (quitting) return
        const backend = choose()
        try {
          await backend.start()
        } catch (error) {
          if (!experimentalSelected) throw error
          failed = true
          backend.quit()
          console.error(
            '[experimental-game-overlay] Startup failed; restart required',
          )
        }
      })()
    }
    return startup
  },
  quit() {
    quitting = true
    selected?.quit()
  },
  isReady() {
    return choose().isReady()
  },
  createWindow(
    name: string,
    options: Electron.BrowserWindowConstructorOptions,
  ) {
    return choose().createWindow(name, options)
  },
  addOverlayWindow(
    name: string,
    window: Electron.BrowserWindow,
    dragBorder = 0,
    captionHeight = 0,
    transparent = false,
  ) {
    return choose().addOverlayWindow(
      name,
      window,
      dragBorder,
      captionHeight,
      transparent,
    )
  },
  isProcessHooked(pid: number) {
    return gameOverlay.enabled && !!selected?.isProcessHooked(pid)
  },
  startIntercept() {
    if (gameOverlay.enabled) selected?.startIntercept()
  },
  stopIntercept() {
    selected?.stopIntercept()
  },
}

export default gameOverlay
