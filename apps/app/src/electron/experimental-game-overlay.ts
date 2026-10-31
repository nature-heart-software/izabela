import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
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
  OverlayTargetWatcher,
  OverlayTargetPolicy,
  OverlayTargetWatcherEvent,
  OverlayDiagnostic,
} from 'electron-game-overlay'

type WindowEntry = {
  window: Electron.BrowserWindow
  owned: boolean
  wrapper?: ElectronOverlayWindow
  cleanup: () => void
}
class ExperimentalGameOverlay {
  public intercepting = false
  private quitting = false
  private generation = 0
  private starting?: Promise<boolean>
  private readiness: Promise<boolean> = Promise.resolve(false)
  private stopSettings?: WatchStopHandle
  private owner?: ElectronGameOverlay
  private session?: OverlaySession
  private targets?: OverlayTargetWatcher
  private sdk?: typeof import('electron-game-overlay')
  private warnings = 0
  private active = false
  private connected = new Set<number>()
  private requested = false
  private surfaces = new Set<number>()
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
      const config = sdk.createReShadeLaunchConfig({
        runsRootDirectory: path.join(
          app.getPath('userData'),
          'experimental-game-overlay',
          'runs',
        ),
      })
      this.owner = new sdk.ElectronGameOverlay({ allowPrereleaseBroker: true })
      const session = (this.session = this.owner.createSession())
      session.start()
      if (
        !(await this.waitFor(session.whenReady())) ||
        this.quitting ||
        generation !== this.generation
      )
        return false
      this.active = true
      this.bindSession(session, generation)
      this.registerIPC(generation)
      const targets = (this.targets = new sdk.OverlayTargetWatcher(session, {
        config,
        ...this.targetPolicy(),
      }))
      this.subscriptions.push(
        targets.onEvent((event) => this.targetEvent(event, generation)),
      )
      this.subscriptions.push(
        watch(
          () => JSON.stringify(this.policyRules()),
          () => {
            if (!this.active || generation !== this.generation) return
            try {
              // SDK updates cancel removed selectors synchronously and retain
              // uncertain attempts. Only the application computes authorization.
              this.readiness = this.waitFor(
                targets.update(this.targetPolicy()),
              ).catch((error) => {
                if (this.active && generation === this.generation) {
                  this.warn(error)
                  this.stopIntercept()
                }
                return false
              })
            } catch (error) {
              this.warn(error)
              this.stopIntercept()
              this.readiness = Promise.resolve(false)
            }
          },
          { flush: 'sync' },
        ),
      )
      return (
        (await this.waitFor(targets.ready)) &&
        this.active &&
        generation === this.generation
      )
    } catch (error) {
      if (generation !== this.generation) return false
      this.warn(error)
      this.stopResources()
      throw new Error('Experimental overlay startup failed')
    }
  }

  private policyRules() {
    const store = useGameOverlayStore(),
      databases = useDatabasesStore().data
    return [
      store.allowlist,
      store.denylist,
      databases['game-overlay-allowlist'] || [],
      databases['game-overlay-denylist'] || [],
    ].map((rules) =>
      rules.filter(Boolean).map((rule) => rule.replace(/\\/g, '/')),
    )
  }

  private targetPolicy(): OverlayTargetPolicy {
    const [allowlist, denylist, databaseAllowlist, databaseDenylist] =
      this.policyRules()
    const allows = [...allowlist, ...databaseAllowlist],
      denies = [...denylist, ...databaseDenylist]
    if (!allows.length) return {}
    if (!this.sdk) throw new Error('Experimental overlay SDK is unavailable')
    return {
      earlyPolicy: this.sdk.createOverlayProcessPolicy({
        allow: allows,
        deny: denies,
      }),
    }
  }

  private targetEvent(event: OverlayTargetWatcherEvent, generation: number) {
    if (!this.active || this.quitting || generation !== this.generation) return
    if (event.type === 'armed' && import.meta.env.DEV)
      console.info(
        '[experimental-game-overlay] Early watcher armed',
        event.selector.processName || 'native allow/deny policy',
      )
    if (event.type === 'connected' && !event.target.cancelled) {
      this.connected.add(event.target.pid)
      this.emitResize()
    } else if (
      event.type === 'cancelled' ||
      event.type === 'exited' ||
      event.type === 'transport-lost'
    ) {
      if (event.type !== 'transport-lost')
        this.surfaces.delete(event.target.pid)
      if (this.connected.delete(event.target.pid)) this.stopIntercept()
    } else if (event.type === 'discovery-blocked') {
      if (this.warnings++ < 5)
        console.warn(
          '[experimental-game-overlay] Future target discovery blocked; authorized overlays remain active.',
        )
    } else if (event.type === 'error') {
      this.warn(event.error)
      if (event.target && this.connected.delete(event.target.pid))
        this.stopIntercept()
      // Target/selector errors retain uncertain SDK reservations. An unscoped
      // controller error stops this application backend, without a retry.
      if (!event.target && !event.selector) this.stopResources()
    }
  }

  private warn(
    error?: unknown,
    sessionDiagnostic?: Pick<OverlayDiagnostic, 'code' | 'source' | 'pid'>,
  ) {
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
          : sessionDiagnostic
          ? {
              code: sessionDiagnostic.code,
              source: sessionDiagnostic.source,
              pid: sessionDiagnostic.pid,
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
      session.on('diagnostic', (diagnostic) => {
        if (current() && diagnostic.severity === 'error')
          this.warn(undefined, diagnostic)
      }),
      ...(['targetDisconnected', 'targetTransportLost'] as const).map((event) =>
        session.on(event, ({ pid }) => {
          if (!current()) return
          if (this.connected.delete(pid)) this.stopIntercept()
        }),
      ),
      session.on('inputInterceptionChanged', ({ pid, intercepting }) => {
        if (!current() || !this.connected.has(pid)) return
        if (intercepting && !this.requested) this.stopIntercept()
        else this.intercepting = intercepting
      }),
      session.on('targetSurfaceChanged', ({ pid }) => {
        if (!current()) return
        this.surfaces.add(pid)
        if (import.meta.env.DEV)
          console.info('[experimental-game-overlay] Target surface ready', {
            pid,
            rendererReady: !!this.renderer(),
          })
        this.emitResize()
      }),
      session.on('targetSurfaceRemoved', ({ pid }) => {
        if (!current()) return
        this.surfaces.delete(pid)
        if (this.connected.has(pid)) this.stopIntercept()
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
    if (
      !this.active ||
      ![...this.connected].some((pid) => this.surfaces.has(pid)) ||
      !entry?.wrapper
    )
      return
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
    this.attempt(() => this.targets?.dispose())
    this.targets = undefined
    this.attempt(() => this.session?.close())
    this.session = undefined
    this.attempt(() => this.owner?.dispose())
    this.owner = undefined
    this.surfaces.clear()
  }
}

export default new ExperimentalGameOverlay()
