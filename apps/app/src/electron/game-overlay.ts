import { BrowserWindow, screen, shell } from 'electron'
import {
  emitIPCGameOverlayResize,
  onIPCGameOverlayStartIntercept,
  onIPCGameOverlayStopIntercept,
} from '@/electron/events/main.ts'
import { mouse, Point } from '@nut-tree-fork/nut-js'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils.ts'
import { fork } from 'child_process'
import { Window } from 'win-control'
import { Deferred } from '@packages/toolbox'

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

class GameOverlay {
  public Overlay: any = null
  public hookedProcesses: ProcessInfo[] = []
  public intercepting = false
  private windows: Map<string, Electron.BrowserWindow> = new Map()
  private markQuit = false
  private scaleFactor = 1.0

  constructor() {}

  public isReady = () => ready.promise

  public getWindow(window: string) {
    return this.windows.get(window) || null
  }

  public startOverlay() {
    console.log(`starting overlay...`)
    this.Overlay!.start()
    this.Overlay!.setHotkeys([
      {
        name: 'overlay.hotkey.toggleInputIntercept',
        keyCode: 113,
        modifiers: { ctrl: true },
      },
    ])

    this.Overlay!.setEventCallback((event: string, payload: any) => {
      console.log(event, payload)
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
      if (event === 'game.input.intercept' && payload.intercepting) {
        const focusWin = this.windows.get('messenger-game-overlay')
        if (focusWin) {
          focusWin.blurWebView()
          focusWin.focusOnWebView()
          const { top, left, right, bottom } = Window.getByPid(
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
      const foregroundWindow = Window.getForeground()
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

  public injectByProcess(processInfo: ProcessInfo) {
    for (const window of this.Overlay.getTopWindows()) {
      if (window.processId === processInfo.pid) {
        console.log(
          `--------------------\n injecting ${JSON.stringify(window)}`,
        )
        this.Overlay.injectProcess(window)
        this.hookedProcesses.push(processInfo)
      }
    }
  }

  public start() {
    return import('@packages/electron-game-overlay').then((Overlay) => {
      this.Overlay = Overlay.default
      this.scaleFactor = screen.getDisplayNearestPoint({
        x: 0,
        y: 0,
      }).scaleFactor

      this.startOverlay()

      const child = fork(path.join(EXTERNALS_DIR, 'detect-game.js'))

      child.on('message', (processInfo: ProcessEvent) => {
        if (processInfo.type === 'process-creation') {
          const { filepath } = processInfo.payload
          // console.log(`[game-detection]: process creation - ${process}::${pid}(${user}) ["${filepath}"]`)
          const isGame = [
            // processInfo.modules.find(module => module.path.includes('d3d')),
            // processInfo.modules.find(module => module.path.includes('dxgi')),
            // processInfo.modules.find(module => module.path.includes('steamapps')),
            filepath.includes('steamapps'),
            filepath.includes('demo.exe'),
          ].some(Boolean)
          if (isGame) {
            console.log('[game-overlay]: Game launched', filepath)
            this.injectByProcessOnceFocused(processInfo.payload)
          }
        }
        if (processInfo.type === 'process-deletion') {
          if (
            this.hookedProcesses.find(
              (process) => process.pid === processInfo.payload.pid,
            )
          ) {
            this.hookedProcesses = this.hookedProcesses.filter(
              (process) => process.pid !== processInfo.payload.pid,
            )
          }
        }
      })

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
    this.Overlay!.sendCommand({
      command: 'input.intercept',
      intercept: true,
    })
  }

  public stopIntercept() {
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
}

const gameOverlay = new GameOverlay()

export default gameOverlay
