import { app, BrowserWindow, ipcMain } from 'electron'
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
  observeOverlayProcesses,
  OverlayProcessIdentity,
} from 'electron-game-overlay'

type WindowEntry = {
  window: Electron.BrowserWindow
  owned: boolean
  wrapper?: ElectronOverlayWindow
  cleanup: () => void
}
type EarlyProcess = {
  name: string
  executablePath?: string
  launcher?: ReShadeOverlayLauncher
  pid?: number
  disabled: boolean
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
  private observer?: ReturnType<typeof observeOverlayProcesses>
  private launchers = new Map<number, ReShadeOverlayLauncher | undefined>()
  private earlyProcesses = new Map<string, EarlyProcess>()
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
      const processEvent = (type: string, identity: OverlayProcessIdentity) => {
        if (!this.active || this.quitting || generation !== this.generation)
          return
        this.processEvent({
          type,
          payload: {
            pid: identity.pid,
            process: path.win32.basename(identity.executablePath),
            filepath: identity.executablePath,
          },
        })
      }
      const observer = (this.observer = sdk.observeOverlayProcesses({
        runtimeDirectory: config.runtimeDirectory,
        onCreated: (identity) => processEvent('process-creation', identity),
        onExited: (identity) => processEvent('process-deletion', identity),
        onError: () => {
          if (!this.active || generation !== this.generation) return
          this.warn()
          this.stopResources()
        },
      }))
      // Only selectors fully authorized before creation can prearm injection.
      // The SDK baselines existing processes for both observation and prearming.
      const store = useGameOverlayStore()
      const policy = () => {
        const databases = useDatabasesStore().data
        return JSON.stringify([
          store.allowlist.filter(Boolean),
          store.denylist.filter(Boolean),
          (databases['game-overlay-denylist'] || []).filter(Boolean),
        ])
      }
      const denies = [
        ...store.denylist,
        ...(useDatabasesStore().data['game-overlay-denylist'] || []),
      ].filter(Boolean)
      const early = new Map<string, EarlyProcess>()
      for (const rule of store.allowlist) {
        const normalized = rule.replace(/\\/g, '/')
        if (
          path.win32.isAbsolute(normalized) &&
          !micromatch.scan(normalized).isGlob &&
          /\.exe$/i.test(normalized) &&
          this.isAllowed(normalized)
        ) {
          early.set(normalized.toLowerCase(), {
            name: path.win32.basename(normalized).toLowerCase(),
            executablePath: normalized,
            disabled: false,
          })
        } else if (!denies.length) {
          const name = /^\*\*\/([a-z0-9][a-z0-9 ._-]*\.exe)$/i.exec(rule)?.[1]
          if (name && name.length <= 260)
            early.set(name.toLowerCase(), {
              name: name.toLowerCase(),
              disabled: false,
            })
        }
      }
      // A globally permitted basename already covers any exact path for it.
      for (const [key, entry] of early)
        if (entry.executablePath && early.has(entry.name)) early.delete(key)
      const arming = Promise.all(
        [...early].map(([key, entry]) => {
          if (import.meta.env.DEV)
            console.info('[experimental-game-overlay] Early target', {
              name: entry.name,
              exactPath: !!entry.executablePath,
            })
          this.earlyProcesses.set(key, entry)
          return this.armEarlyProcess(entry, generation)
        }),
      ).then((results) => {
        if (results.some((ready) => !ready))
          throw new Error('Early overlay watcher failed')
      })
      const stopPolicy = watch(
        policy,
        () => {
          if (import.meta.env.DEV && this.earlyProcesses.size)
            console.info(
              '[experimental-game-overlay] Early watchers cancelled after policy change',
            )
          // Cancel native name watchers before a changed policy can reject their target.
          // Keep their names reserved for this run; an uncertain injection never retries.
          this.earlyProcesses.forEach((entry) => {
            entry.disabled = true
            this.attempt(() => entry.launcher?.dispose())
            if (entry.pid !== undefined) this.connected.delete(entry.pid)
          })
          if (this.earlyProcesses.size) this.stopIntercept()
        },
        { flush: 'sync' },
      )
      this.subscriptions.push(stopPolicy)
      return (
        (await this.waitFor(Promise.all([observer.ready, arming]))) &&
        this.active &&
        generation === this.generation
      )
    } catch {
      if (generation !== this.generation) return false
      this.stopResources()
      this.warn()
      throw new Error('Experimental overlay startup failed')
    }
  }

  private async armEarlyProcess(entry: EarlyProcess, generation: number) {
    try {
      const launcher =
        this.prepared || new this.sdk!.ReShadeOverlayLauncher(this.config!)
      this.prepared = undefined
      entry.launcher = launcher
      await launcher.prepare()
      if (entry.disabled || !this.active || generation !== this.generation)
        return false
      return await new Promise<boolean>((resolve) => {
        const stop = launcher.onEvent((event) => {
          if (
            !this.active ||
            generation !== this.generation ||
            entry.disabled ||
            entry.launcher !== launcher
          )
            return
          if (event.type === 'injector-watcher-ready') {
            if (import.meta.env.DEV)
              console.info(
                '[experimental-game-overlay] Early watcher armed',
                entry.name,
              )
            resolve(true)
          }
          if (event.type === 'injector-returned') {
            entry.pid = event.result.injectorTargetPid
            this.launchers.set(entry.pid, launcher)
            if (import.meta.env.DEV)
              console.info(
                '[experimental-game-overlay] Early injector returned',
                { name: entry.name, pid: entry.pid },
              )
          }
        })
        void launcher
          .attach(this.session!, {
            processName: entry.name,
            ...(entry.executablePath
              ? { executablePath: entry.executablePath }
              : {}),
          })
          .catch((error: unknown) => {
            resolve(false)
            if (
              this.active &&
              generation === this.generation &&
              !entry.disabled
            )
              this.warn(error)
          })
          .finally(stop)
      })
    } catch (error) {
      if (this.active && generation === this.generation) this.warn(error)
      return false
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
      const early = [...this.earlyProcesses.values()].find(
        (entry) => entry.pid === pid,
      )
      if (early && !early.disabled && this.active && !this.quitting) {
        early.pid = undefined
        early.launcher = undefined
        void this.armEarlyProcess(early, this.generation).then((ready) => {
          if (!ready) early.disabled = true
        })
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
    if (!this.isAllowed(filepath)) return
    const early = this.earlyProcess(filepath)
    if (early) {
      if (
        !early.disabled &&
        early.launcher &&
        (early.pid === undefined || early.pid === pid)
      ) {
        early.pid = pid
        this.launchers.set(pid, early.launcher)
      }
      return
    }
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
        .catch((error: unknown) => {
          if (
            this.active &&
            generation === this.generation &&
            this.launchers.get(pid) === launcher
          )
            this.warn(error)
        })
    } catch {
      this.warn()
    }
  }

  private earlyProcess(filepath: string) {
    return (
      this.earlyProcesses.get(filepath.replace(/\\/g, '/').toLowerCase()) ||
      this.earlyProcesses.get(path.win32.basename(filepath).toLowerCase())
    )
  }

  private isAllowed(filepath: string) {
    const store = useGameOverlayStore(),
      databases = useDatabasesStore().data
    const options = { windows: true, nocase: true, dot: true }
    return (
      micromatch.isMatch(
        filepath.replace(/\\/g, '/'),
        [...store.allowlist, ...(databases['game-overlay-allowlist'] || [])]
          .filter(Boolean)
          .map((rule) => rule.replace(/\\/g, '/')),
        options,
      ) &&
      !micromatch.isMatch(
        filepath.replace(/\\/g, '/'),
        [...store.denylist, ...(databases['game-overlay-denylist'] || [])]
          .filter(Boolean)
          .map((rule) => rule.replace(/\\/g, '/')),
        options,
      )
    )
  }

  private warn(error?: unknown) {
    // Log only SDK-owned classifications, never paths, discovery tokens or raw errors.
    const diagnostic = this.sdk?.isReShadeOperationError(error)
      ? error.diagnostic
      : undefined
    if (this.warnings++ < 5)
      console.warn(
        '[experimental-game-overlay] Runtime operation failed; no automatic retry.',
        diagnostic
          ? {
              code: diagnostic.code,
              stage: diagnostic.stage,
              pid: diagnostic.pid,
              runtimeStartupCode: diagnostic.runtimeStartupCode,
            }
          : {},
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
      session.on('targetConnected', ({ pid, executablePath }) => {
        if (!current()) return
        if (import.meta.env.DEV)
          console.info('[experimental-game-overlay] Target connected', { pid })
        const early =
          typeof executablePath === 'string'
            ? this.earlyProcess(executablePath)
            : undefined
        if (early?.disabled) return
        // Authentication can arrive before the native watcher publishes its result.
        if (
          !this.launchers.has(pid) &&
          typeof executablePath === 'string' &&
          path.win32.isAbsolute(executablePath)
        ) {
          const entry = this.earlyProcess(executablePath)
          if (
            entry?.launcher &&
            !entry.disabled &&
            (entry.pid === undefined || entry.pid === pid) &&
            this.isAllowed(executablePath)
          ) {
            entry.pid = pid
            this.launchers.set(pid, entry.launcher)
          }
        }
        if (this.launchers.has(pid)) this.connected.add(pid)
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
        if (import.meta.env.DEV)
          console.info('[experimental-game-overlay] Target surface ready', {
            pid,
            rendererReady: !!this.renderer(),
          })
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
    ) {
      if (import.meta.env.DEV)
        console.info('[experimental-game-overlay] Interception unavailable', {
          active: this.active,
          targets: this.connected.size,
          rendererReady: !!entry,
          wrapperReady: !!entry?.wrapper,
        })
      return
    }
    if (import.meta.env.DEV)
      console.info('[experimental-game-overlay] Starting interception')
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
      this.observer?.dispose()
    })
    this.observer = undefined
    this.attempt(() => this.prepared?.dispose())
    this.prepared = undefined
    this.launchers.forEach((launcher) =>
      this.attempt(() => launcher?.dispose()),
    )
    this.launchers.clear()
    this.earlyProcesses.forEach((entry) =>
      this.attempt(() => entry.launcher?.dispose()),
    )
    this.earlyProcesses.clear()
    this.attempt(() => this.session?.close())
    this.session = undefined
    this.attempt(() => this.owner?.dispose())
    this.owner = undefined
    this.hasSurface = false
  }
}

export default new ExperimentalGameOverlay()
