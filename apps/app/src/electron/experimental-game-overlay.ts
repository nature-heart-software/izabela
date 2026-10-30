import { app, BrowserWindow, ipcMain } from 'electron'
import { fork, type ChildProcess } from 'child_process'
import path from 'path'
import micromatch from 'micromatch'
import { watch, type WatchStopHandle } from 'vue'
import { useGameOverlayStore } from '@/features/game-overlay/store'
import { useDatabasesStore } from '@/features/databases/store'
import {
  emitIPCGameOverlayResize,
  onIPCGameOverlayStartIntercept,
  onIPCGameOverlayStopIntercept,
} from '@/electron/events/main.ts'
import type {
  ElectronGameOverlay,
  ElectronOverlayWindow,
  OverlaySession,
  ReShadeLaunchConfig,
  ReShadeOverlayLauncher,
} from 'electron-game-overlay'

type WindowEntry = {
  window: Electron.BrowserWindow
  owned: boolean
  wrapper?: ElectronOverlayWindow
  cleanup: () => void
}
const unpacked = (filename: string) =>
  filename.replace(/app\.asar([\\/])/, 'app.asar.unpacked$1')

class ExperimentalGameOverlay {
  public intercepting = false
  private quitting = false
  private generation = 0
  private starting?: Promise<boolean>
  private readiness: Promise<boolean> = Promise.resolve(false)
  private stopSettings?: WatchStopHandle
  private owner?: ElectronGameOverlay
  private session?: OverlaySession
  private prepared?: ReShadeOverlayLauncher
  private child?: ChildProcess
  private launchers = new Map<number, ReShadeOverlayLauncher | undefined>()
  private sdk?: typeof import('electron-game-overlay')
  private warnings = 0
  private config?: ReShadeLaunchConfig
  private active = false
  private connected = new Set<number>()
  private requested = false
  private hasSurface = false
  private windows = new Map<string, WindowEntry>()
  private subscriptions: (() => void)[] = []
  private cancelReadiness?: () => void

  public isReady() {
    return this.starting && !this.stopSettings && !this.quitting
      ? this.starting
      : this.readiness
  }

  public start() {
    if (this.quitting || process.platform !== 'win32')
      return Promise.resolve(false)
    if (this.starting) return this.starting
    this.starting = (async () => {
      const store = useGameOverlayStore()
      if (!(await this.waitFor(store.$whenReady())) || this.quitting)
        return false
      this.stopSettings = watch(
        () => store.enableExperimentalGameOverlay,
        (enabled) => {
          if (enabled) {
            this.readiness = this.activate()
            void this.readiness.catch(() => {})
          } else this.stopResources()
        },
        { immediate: true, flush: 'sync' },
      )
      return this.readiness
    })().catch(() => {
      this.stopResources()
      throw new Error('Experimental overlay startup failed')
    })
    return this.starting
  }

  private async activate() {
    const generation = ++this.generation
    try {
      const sdk: typeof import('electron-game-overlay') = require('electron-game-overlay')
      this.sdk = sdk
      const config = sdk.parseReShadeLaunchConfig(['--reshade-overlay'], {
        bundledRuntimeDirectory: path.join(
          path.dirname(
            unpacked(require.resolve('electron-game-overlay/package.json')),
          ),
          'dist',
          'runtime',
          'win32-x64',
          'reshade',
        ),
        runsRootDirectory: path.join(
          app.getPath('userData'),
          'experimental-game-overlay',
          'runs',
        ),
      })!
      this.config = config
      this.owner = new sdk.ElectronGameOverlay({ allowPrereleaseBroker: true })
      const session = (this.session = this.owner.createSession())
      this.prepared = new sdk.ReShadeOverlayLauncher(config)
      session.start()
      const ready = await this.waitFor(
        Promise.all([session.whenReady(), this.prepared.prepare()]),
      )
      if (!ready || this.quitting || generation !== this.generation)
        return false
      this.active = true
      this.bindSession(session, generation)
      this.registerIPC(generation)
      const child = (this.child = fork(
        unpacked(require.resolve('@packages/process-watcher')),
        [],
        {
          stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        },
      ))
      const onMessage = (event: unknown) => {
        if (this.active && !this.quitting && generation === this.generation)
          this.processEvent(event)
      }
      child.on('message', onMessage)
      const onError = () => {
        if (generation !== this.generation) return
        this.warn()
        this.stopResources()
      }
      const onExit = () => {
        if (this.child === child) this.child = undefined
        onError()
      }
      child.on('error', onError)
      child.on('exit', onExit)
      this.subscriptions.push(() => {
        child.removeListener('message', onMessage)
        child.removeListener('error', onError)
        child.removeListener('exit', onExit)
      })
      return true
    } catch {
      if (generation !== this.generation) return false
      this.stopResources()
      this.warn()
      throw new Error('Experimental overlay startup failed')
    }
  }

  private processEvent(event: unknown) {
    if (
      !event ||
      typeof event !== 'object' ||
      !('type' in event) ||
      !('payload' in event)
    )
      return
    const payload = event.payload as
      | { pid?: number; process?: string; filepath?: string }
      | undefined
    const pid = payload?.pid
    if (!Number.isInteger(pid) || !pid || pid < 0 || pid > 0xffffffff) return
    if (event.type === 'process-deletion') {
      const launcher = this.launchers.get(pid)
      this.attempt(() => {
        launcher?.confirmTargetExited(pid)
      })
      this.attempt(() => launcher?.dispose())
      this.launchers.delete(pid)
      if (this.connected.delete(pid)) {
        this.hasSurface = false
        this.stopIntercept()
      }
      return
    }
    if (event.type !== 'process-creation' || this.launchers.has(pid)) return
    const { process: processName, filepath } = payload!
    if (
      typeof processName !== 'string' ||
      typeof filepath !== 'string' ||
      !path.win32.isAbsolute(filepath) ||
      path.win32.basename(filepath).toLowerCase() !== processName.toLowerCase()
    )
      return
    const store = useGameOverlayStore(),
      databases = useDatabasesStore().data
    if (
      !micromatch.isMatch(
        filepath,
        [
          ...store.allowlist,
          ...(databases['game-overlay-allowlist'] || []),
        ].filter(Boolean),
      ) ||
      micromatch.isMatch(
        filepath,
        [
          ...store.denylist,
          ...(databases['game-overlay-denylist'] || []),
        ].filter(Boolean),
      )
    )
      return
    this.launchers.set(pid, undefined)
    // Retain even failed launchers until authoritative deletion; never retry uncertainty.
    const generation = this.generation
    try {
      const launcher =
        this.prepared || new this.sdk!.ReShadeOverlayLauncher(this.config!)
      this.prepared = undefined
      this.launchers.set(pid, launcher)
      void launcher
        .attach(this.session!, { pid, processName, executablePath: filepath })
        .catch(() => {
          if (
            this.active &&
            generation === this.generation &&
            this.launchers.get(pid) === launcher
          )
            this.warn()
        })
    } catch {
      this.warn()
    }
  }

  private warn() {
    if (this.warnings++ < 5)
      console.warn(
        '[experimental-game-overlay] Runtime operation failed; no automatic retry.',
      )
  }

  private attempt(action: () => void) {
    try {
      action()
    } catch {
      this.warn()
    }
  }

  private waitFor(work: Promise<unknown>) {
    const cancelled = new Promise<boolean>((resolve) => {
      this.cancelReadiness = () => resolve(false)
    })
    return Promise.race([work.then(() => true), cancelled])
  }

  private bindSession(session: OverlaySession, generation: number) {
    const current = () =>
      this.active && !this.quitting && generation === this.generation
    this.subscriptions.push(
      session.onClose(() => {
        if (!current()) return
        this.warn()
        this.stopResources()
      }),
      session.on('diagnostic', ({ severity }) => {
        if (current() && severity === 'error') this.warn()
      }),
      session.on('targetConnected', ({ pid }) => {
        if (current() && this.launchers.has(pid)) this.connected.add(pid)
      }),
      ...(['targetDisconnected', 'targetTransportLost'] as const).map((event) =>
        session.on(event, ({ pid }) => {
          if (!current()) return
          this.connected.delete(pid)
          this.stopIntercept()
        }),
      ),
      session.on('inputInterceptionChanged', ({ pid, intercepting }) => {
        if (!current() || !this.connected.has(pid)) return
        if (intercepting && !this.requested) this.stopIntercept()
        else this.intercepting = intercepting
      }),
      session.on('targetSurfaceChanged', ({ pid }) => {
        if (!current() || !this.connected.has(pid)) return
        this.hasSurface = true
        this.emitResize()
      }),
      session.on('targetSurfaceRemoved', ({ pid }) => {
        if (!current() || !this.connected.has(pid)) return
        this.hasSurface = false
        this.stopIntercept()
      }),
    )
  }

  private registerIPC(generation: number) {
    // Existing postman helpers expose no unsubscribe. Retain only the native
    // listeners synchronously added by these two registrations.
    const before = new Map(
      ipcMain
        .eventNames()
        .map((name) => [name, new Set(ipcMain.listeners(name))]),
    )
    onIPCGameOverlayStartIntercept(() => {
      if (generation === this.generation) this.startIntercept()
    })
    onIPCGameOverlayStopIntercept(() => {
      if (generation === this.generation) this.stopIntercept()
    })
    for (const name of ipcMain.eventNames()) {
      if (typeof name !== 'string') continue
      for (const listener of ipcMain.listeners(name)) {
        if (!before.get(name)?.has(listener))
          this.subscriptions.push(() => {
            ipcMain.removeListener(
              name,
              listener as (...args: unknown[]) => void,
            )
          })
      }
    }
  }

  private renderer() {
    const entry = this.windows.get('messenger-game-overlay')
    return entry &&
      !entry.window.isDestroyed() &&
      !entry.window.webContents.isLoadingMainFrame()
      ? entry
      : undefined
  }

  private emitResize() {
    const entry = this.renderer()
    if (!this.active || !this.hasSurface || !entry?.wrapper) return
    this.attempt(() => {
      const { width, height } = entry.wrapper!.getBounds()
      emitIPCGameOverlayResize({ width, height })
    })
  }

  public createWindow(
    name: string,
    options: Electron.BrowserWindowConstructorOptions,
  ) {
    if (
      this.quitting ||
      process.platform !== 'win32' ||
      !useGameOverlayStore().enableExperimentalGameOverlay
    )
      throw new Error('Experimental overlay is disabled')
    if (this.windows.has(name))
      throw new Error('Experimental overlay window name already exists')
    const window = new BrowserWindow({
      ...options,
      show: false,
      webPreferences: { ...options.webPreferences, offscreen: true },
    })
    this.trackWindow(name, window, true)
    return window
  }

  private trackWindow(
    name: string,
    window: Electron.BrowserWindow,
    owned: boolean,
  ) {
    if (this.windows.has(name))
      throw new Error('Experimental overlay window name already exists')
    const onLoad = () =>
      queueMicrotask(() => {
        if (this.windows.get(name)?.window === window) this.emitResize()
      })
    const onClosed = () => {
      const entry = this.windows.get(name)
      if (entry?.window !== window) return
      this.stopIntercept()
      this.windows.delete(name)
      this.attempt(entry.cleanup)
      this.attempt(() => entry.wrapper?.destroy())
    }
    window.webContents.on('did-finish-load', onLoad)
    window.on('closed', onClosed)
    this.windows.set(name, {
      window,
      owned,
      cleanup: () => {
        window.webContents.removeListener('did-finish-load', onLoad)
        window.removeListener('closed', onClosed)
      },
    })
  }

  public addOverlayWindow(
    name: string,
    window: Electron.BrowserWindow,
    dragBorder = 0,
    captionHeight = 0,
    transparent = false,
  ) {
    if (!this.active) throw new Error('Experimental overlay is not ready')
    if (!this.windows.has(name)) this.trackWindow(name, window, false)
    const entry = this.windows.get(name)!
    if (entry.window !== window)
      throw new Error('Experimental overlay window name already exists')
    if (entry.wrapper) return
    entry.wrapper = this.session!.windows.attach(window, {
      id: name,
      name,
      dragBorder,
      captionHeight,
      transparent,
      focusOnReady: false,
    })
    if (name === 'messenger-game-overlay') {
      entry.wrapper.followTarget({ area: 'render' })
      this.emitResize()
    }
  }

  public isProcessHooked(pid: number) {
    return this.active && this.connected.has(pid) && !!this.renderer()
  }

  public startIntercept() {
    const entry = this.renderer()
    if (
      !this.active ||
      this.quitting ||
      !useGameOverlayStore().enableExperimentalGameOverlay ||
      !this.connected.size ||
      !entry?.wrapper
    )
      return
    this.requested = true
    try {
      entry.wrapper.show()
      entry.wrapper.focus()
      this.session!.input.intercept()
    } catch {
      this.warn()
      this.stopIntercept()
    }
  }

  public stopIntercept() {
    this.requested = false
    this.intercepting = false
    this.attempt(() => this.session?.input.release())
    this.windows.forEach(({ wrapper }) => {
      this.attempt(() => wrapper?.blur())
      this.attempt(() => wrapper?.hide())
    })
  }

  public quit() {
    if (this.quitting) return
    this.quitting = true
    this.stopSettings?.()
    this.stopSettings = undefined
    this.stopResources()
  }

  private stopResources() {
    ++this.generation
    this.active = false
    this.cancelReadiness?.()
    this.cancelReadiness = undefined
    this.readiness = Promise.resolve(false)
    this.stopIntercept()
    this.subscriptions.splice(0).forEach((stop) => this.attempt(stop))
    this.windows.forEach((entry) => {
      this.attempt(entry.cleanup)
      this.attempt(() => entry.wrapper?.destroy())
      if (entry.owned && !entry.window.isDestroyed())
        this.attempt(() => entry.window.destroy())
    })
    this.windows.clear()
    this.connected.clear()
    this.attempt(() => {
      this.child?.kill()
    })
    this.child = undefined
    this.attempt(() => this.prepared?.dispose())
    this.prepared = undefined
    this.launchers.forEach((launcher) =>
      this.attempt(() => launcher?.dispose()),
    )
    this.launchers.clear()
    this.attempt(() => this.session?.close())
    this.session = undefined
    this.attempt(() => this.owner?.dispose())
    this.owner = undefined
    this.hasSurface = false
  }
}

export default new ExperimentalGameOverlay()
