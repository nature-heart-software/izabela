import { BrowserWindow, screen, shell } from 'electron'
import {
  emitIPCGameOverlayResize,
  onIPCGameOverlayStartIntercept,
  onIPCGameOverlayStopIntercept,
} from '@/electron/events/main.ts'
import { mouse, Point } from '@nut-tree-fork/nut-js'
import { fork } from 'child_process'
import { Deferred } from '@packages/toolbox'
import { useGameOverlayStore } from '@/features/game-overlay/store'
import { onWatcherCleanup, watch } from 'vue'
import micromatch from 'micromatch'
import { useDatabasesStore } from '@/features/databases/store'
import path from 'path'

type ProcessInfo = {
  process: string
  pid: number
  filepath: string
  user: string
}

type ProcessEvent = {
  type: 'process-creation' | 'process-deletion'
  payload: ProcessInfo
}

const ready = Deferred()

/* List of games to look into:
 * Games that don't work: Killing Floor 2
 * Games that crash: Marvel Rivals
 * Games that could have issues: FragPunk (fixed for now), Haste
 * */
class GameOverlay {
  public WinControl: any = null
  public Overlay: any = null
  public detectedProcesses: ProcessInfo[] = []
  public intercepting = false
  private windows: Map<string, Electron.BrowserWindow> = new Map()
  private markQuit = false
  private scaleFactor = 1.0
  private hookedProcesses: Record<number, boolean> = {}

  constructor() {}

  public isReady = () => ready.promise

  public getWindow(window: string) {
    return this.windows.get(window) || null
  }

  public startOverlay() {
    console.log(`[game-overlay] Starting overlay...`)
    this.Overlay!.start()
    // this.Overlay!.setHotkeys([
    //   {
    //     name: 'overlay.hotkey.toggleInputIntercept',
    //     keyCode: 113,
    //     modifiers: { ctrl: true },
    //   },
    // ])

    this.Overlay!.setEventCallback((event: string, payload: any) => {
      if (import.meta.env.DEV) console.log(event, payload)
      if (event === 'graphics.fps') this.hookedProcesses[payload.pid] = true
      if (['graphics.window.event.resize', 'graphics.window'].includes(event)) {
        const { width, height } = payload
        emitIPCGameOverlayResize({
          width,
          height,
        })
      }
      if (event === 'game.input') {
        const window = BrowserWindow.fromId(payload.windowId)
        if (window) {
          const intpuEvent = this.Overlay!.translateInputEvent(payload)
          if (intpuEvent) {
            if ('x' in intpuEvent)
              intpuEvent['x'] = Math.round(intpuEvent['x'] / this.scaleFactor)
            if ('y' in intpuEvent)
              intpuEvent['y'] = Math.round(intpuEvent['y'] / this.scaleFactor)
            window.webContents.sendInputEvent(intpuEvent)
          }
        }
      }

      if (event === 'game.input.intercept') {
        this.intercepting = payload.intercepting
      }

      /* This handles game crashes */
      if (event === 'graphics.window.event.focus' && !payload.focuses) {
        this.intercepting = false
      }

      if (event === 'game.input.intercept' && payload.intercepting) {
        const focusWin = this.windows.get('messenger-game-overlay')
        if (focusWin) {
          focusWin.blurWebView()
          focusWin.focusOnWebView()
          const { top, left, right, bottom } = this.WinControl.getByPid(
            payload.pid,
          ).getDimensions()
          const width = right - left
          const height = bottom - top

          mouse.getPosition().then(async (initialPosition) => {
            await mouse.setPosition(
              new Point(left + width / 2, top + height / 2),
            )
            await mouse.leftClick()
            await mouse.setPosition(initialPosition)
          })
        }
      }
    })
  }

  public addOverlayWindow(
    name: string,
    window: Electron.BrowserWindow,
    dragBorder: number = 0,
    captionHeight: number = 0,
    transparent: boolean = false,
  ) {
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())

    this.Overlay!.addWindow(window.id, {
      name,
      transparent,
      resizable: window.isResizable(),
      maxWidth: window.isResizable()
        ? display.bounds.width
        : window.getBounds().width,
      maxHeight: window.isResizable()
        ? display.bounds.height
        : window.getBounds().height,
      minWidth: window.isResizable() ? 100 : window.getBounds().width,
      minHeight: window.isResizable() ? 100 : window.getBounds().height,
      nativeHandle: window.getNativeWindowHandle().readUInt32LE(0),
      rect: {
        x: window.getBounds().x,
        y: window.getBounds().y,
        width: Math.floor(window.getBounds().width * this.scaleFactor),
        height: Math.floor(window.getBounds().height * this.scaleFactor),
      },
      caption: {
        left: Math.floor(dragBorder * this.scaleFactor),
        right: Math.floor(dragBorder * this.scaleFactor),
        top: Math.floor(dragBorder * this.scaleFactor),
        height: Math.floor(captionHeight * this.scaleFactor),
      },
      dragBorderWidth: Math.floor(dragBorder),
    })

    window.webContents.on('paint', (_, __, image: Electron.NativeImage) => {
      if (this.markQuit) {
        return
      }
      this.Overlay!.sendFrameBuffer(
        window.id,
        image.getBitmap(),
        image.getSize().width,
        image.getSize().height,
      )
    })

    window.on('ready-to-show', () => {
      window.focusOnWebView()
    })

    window.on('resize', () => {
      this.Overlay!.sendWindowBounds(window.id, {
        rect: {
          x: window.getBounds().x,
          y: window.getBounds().y,
          width: Math.floor(window.getBounds().width * this.scaleFactor),
          height: Math.floor(window.getBounds().height * this.scaleFactor),
        },
      })
    })

    const windowId = window.id
    window.on('closed', () => {
      this.Overlay!.closeWindow(windowId)
    })

    window.webContents.on('cursor-changed', (_, type) => {
      let cursor
      switch (type) {
        case 'default':
          cursor = 'IDC_ARROW'
          break
        case 'pointer':
          cursor = 'IDC_HAND'
          break
        case 'crosshair':
          cursor = 'IDC_CROSS'
          break
        case 'text':
          cursor = 'IDC_IBEAM'
          break
        case 'wait':
          cursor = 'IDC_WAIT'
          break
        case 'help':
          cursor = 'IDC_HELP'
          break
        case 'move':
          cursor = 'IDC_SIZEALL'
          break
        case 'nwse-resize':
          cursor = 'IDC_SIZENWSE'
          break
        case 'nesw-resize':
          cursor = 'IDC_SIZENESW'
          break
        case 'ns-resize':
          cursor = 'IDC_SIZENS'
          break
        case 'ew-resize':
          cursor = 'IDC_SIZEWE'
          break
        case 'none':
          cursor = ''
          break
      }
      this.Overlay!.sendCommand({ command: 'cursor', cursor })
    })
  }

  public closeAllWindows() {
    const windows = this.windows.values()
    for (const window of windows) {
      window.close()
    }
  }

  public closeWindow(name: string) {
    const window = this.windows.get(name)
    if (window) {
      window.close()
    }
  }

  public injectByProcessOnceFocused(processInfo: ProcessInfo) {
    const { pid } = processInfo
    let timeout: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>
    interval = setInterval(() => {
      const foregroundWindow = this.WinControl.getForeground()
      if (pid === foregroundWindow?.getPid()) {
        clearInterval(interval)
        clearTimeout(timeout)
        this.injectByProcess(processInfo)
      }
    }, 1000)
    setTimeout(
      () => {
        clearInterval(interval)
      },
      5 * 60 * 1000,
    )
  }

  /* Some games needs to be hooked quickly for the overlay to work so favor this method. E.g. FragPunk */
  public injectByProcessOnceCreated(processInfo: ProcessInfo) {
    const { pid } = processInfo
    let timeout: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>
    interval = setInterval(() => {
      const foregroundWindows = this.Overlay.getTopWindows()
      if (foregroundWindows.find((window: any) => window.processId === pid)) {
        clearInterval(interval)
        clearTimeout(timeout)
        this.injectByProcess(processInfo)
      }
    }, 1000)
    setTimeout(
      () => {
        clearInterval(interval)
      },
      5 * 60 * 1000,
    )
  }

  public injectByProcess(processInfo: ProcessInfo) {
    for (const window of this.Overlay.getTopWindows()) {
      if (window.processId === processInfo.pid) {
        console.log(`[game-overlay] Injecting ${JSON.stringify(window)}`)
        this.Overlay.injectProcess(window)
        this.detectedProcesses.push(processInfo)
      }
    }
  }

  public start() {
    const databasesStore = useDatabasesStore()
    const gameOverlayStore = useGameOverlayStore()
    /* Importing win-control in preload breaks reload so we import it dynamically on start instead */
    return Promise.all([
      require('@packages/electron-game-overlay'),
      require('win-control'),
      gameOverlayStore.$whenReady(),
    ]).then(([Overlay, WinControl]) => {
      this.WinControl = WinControl.Window
      this.Overlay = Overlay
      this.scaleFactor = screen.getDisplayNearestPoint({
        x: 0,
        y: 0,
      }).scaleFactor

      this.startOverlay()

      watch(
        () => [
          gameOverlayStore.enableGameOverlay,
          gameOverlayStore.allowlist,
          gameOverlayStore.denylist,
          databasesStore.data,
        ],
        () => {
          if (!gameOverlayStore.enableGameOverlay) return
          console.log('[game-overlay] Creating process watcher process')
          try {
            const child = fork(
              import.meta.env.DEV
                ? require.resolve('@packages/process-watcher')
                : path.join(
                    process.resourcesPath,
                    'app.asar.unpacked',
                    'node_modules',
                    '@packages',
                    'process-watcher',
                  ),
            )
            child.on('message', (processInfo: ProcessEvent) => {
              if (processInfo.type === 'process-creation') {
                const { filepath } = processInfo.payload
                const isGame =
                  micromatch.isMatch(
                    filepath,
                    [
                      ...gameOverlayStore.allowlist,
                      ...(databasesStore.data['game-overlay-allowlist'] || []),
                    ].filter(Boolean),
                  ) &&
                  !micromatch.isMatch(
                    filepath,
                    [
                      ...gameOverlayStore.denylist,
                      ...(databasesStore.data['game-overlay-denylist'] || []),
                    ].filter(Boolean),
                  )
                if (isGame) {
                  console.log('[game-overlay]: Game launched', filepath)
                  // require('windows-tlist').getProcessInfo(processInfo.payload.pid).then(({ modules }: any) => console.log(modules.map(({ path }: any) => path.substring(path.lastIndexOf('\\')+1))))
                  this.injectByProcessOnceCreated(processInfo.payload)
                  // this.injectByProcessOnceFocused(processInfo.payload)
                }
              }
              if (processInfo.type === 'process-deletion') {
                this.removeProcess(processInfo.payload.pid)
              }
            })
            onWatcherCleanup(() => {
              console.log('[game-overlay] Destroying process watcher process')
              child.kill()
            })
          } catch (e) {
            console.error(
              `[game-overlay] Couldn't create process watcher process`,
            )
          }
        },
        {
          deep: true,
          immediate: true,
        },
      )

      onIPCGameOverlayStartIntercept(() => {
        this.startIntercept()
      })

      onIPCGameOverlayStopIntercept(() => {
        this.stopIntercept()
      })

      return ready.resolve(true)
    })
  }

  public quit() {
    this.markQuit = true
    this.closeAllWindows()

    if (this.Overlay) {
      this.Overlay.stop()
    }
  }

  public startIntercept() {
    console.log('[game-overlay] startIntercept')
    this.Overlay!.sendCommand({
      command: 'input.intercept',
      intercept: true,
    })
  }

  public stopIntercept() {
    console.log('[game-overlay] stopIntercept')
    this.Overlay!.sendCommand({
      command: 'input.intercept',
      intercept: false,
    })
  }

  public createWindow(
    name: string,
    option: Electron.BrowserWindowConstructorOptions,
  ) {
    const window = new BrowserWindow(option)
    this.windows.set(name, window)

    window.on('closed', () => {
      this.windows.delete(name)
    })

    window.webContents.on('new-window', (e, url) => {
      e.preventDefault()
      shell.openExternal(url)
    })

    if (import.meta.env.DEV) {
      window.webContents.on(
        'before-input-event',
        (_: Electron.Event, input: Electron.Input) => {
          if (input.key === 'F12' && input.type === 'keyDown') {
            window.webContents.openDevTools()
          }
        },
      )
    }

    return window
  }

  public isProcessHooked(pid: number) {
    return !!this.hookedProcesses[pid]
  }

  private removeProcess(pid: number) {
    this.detectedProcesses = this.detectedProcesses.filter(
      (process) => process.pid !== pid,
    )
    delete this.hookedProcesses[pid]
  }
}

const gameOverlay = new GameOverlay()

export default gameOverlay
