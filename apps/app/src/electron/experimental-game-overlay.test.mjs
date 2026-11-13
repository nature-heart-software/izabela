import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../tests/load-typescript.cjs'

const require = createRequire(import.meta.url)
const { reactive, watch, nextTick } = require('vue')
const {
  createOverlayProcessPolicy,
  overlayProcessPolicyAllows,
} = require('electron-game-overlay')
const filename = fileURLToPath(
  new URL('./experimental-game-overlay.ts', import.meta.url),
)
const drain = async () => {
  await nextTick()
  for (let i = 0; i < 12; i++) await Promise.resolve()
}
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  void promise.catch(() => {})
  return { promise, resolve, reject }
}
class OverlayAddonSetupError extends Error {
  code = 'overlay-addon-setup-failed'
  stage = 'register'
  filesystemCode = 'EACCES'
}
function fixture({
  enabled = false,
  platform = 'win32',
  ready,
  managedReady,
  maintenanceReady,
  storeReady,
  preloadReady,
  failAt,
  pathApi = path,
} = {}) {
  let time = 0
  const calls = [],
    controllers = [],
    sessions = [],
    wrappers = [],
    resizes = [],
    logs = []
  const ipcMain = new EventEmitter(),
    unrelated = () => {}
  ipcMain.on('start', unrelated)
  const store = reactive({
    enableExperimentalGameOverlay: enabled,
    enableGameOverlay: true,
    allowlist: ['C:/Games/**'],
    denylist: ['**/blocked.exe'],
    $whenReady: () => storeReady?.promise ?? Promise.resolve(),
  })
  const database = reactive({
    data: {
      'game-overlay-allowlist': ['D:/Games/**'],
      'game-overlay-denylist': ['**/db-blocked.exe'],
    },
  })
  class BrowserWindow extends EventEmitter {
    constructor(options = {}) {
      super()
      this.options = options
      this.destroyed = false
      this.loading = true
      this.webContents = Object.assign(new EventEmitter(), {
        isLoadingMainFrame: () => this.loading,
      })
      calls.push('window')
    }
    isDestroyed() {
      return this.destroyed
    }
    destroy() {
      if (!this.destroyed) {
        this.destroyed = true
        this.emit('closed')
      }
    }
    finishLoad() {
      this.loading = false
      this.webContents.emit('did-finish-load')
    }
  }
  class Session extends EventEmitter {
    constructor() {
      super()
      sessions.push(this)
      this.input = {
        intercept: () => calls.push('intercept'),
        release: () => calls.push('release'),
      }
      this.windows = {
        attach: (window, options) => {
          const wrapper = {
            window,
            options,
            visible: false,
            show() {
              this.visible = true
              calls.push('show')
            },
            hide() {
              this.visible = false
              calls.push('hide')
            },
            focus() {
              calls.push('focus')
            },
            blur() {
              calls.push('blur')
            },
            followTarget(options) {
              this.follow = { ...options }
              calls.push('follow')
            },
            getBounds: () => ({ x: 0, y: 0, width: 1280, height: 720 }),
            destroy() {
              this.destroyed = true
              calls.push('wrapper.destroy')
            },
          }
          wrappers.push(wrapper)
          return wrapper
        },
      }
    }
    on(event, callback) {
      super.on(event, callback)
      return () => this.removeListener(event, callback)
    }
    start() {
      calls.push('session.start')
    }
    whenReady() {
      calls.push('session.ready')
      if (failAt === 'ready') return Promise.reject(new Error('SECRET'))
      return ready?.promise ?? Promise.resolve()
    }
    close() {
      if (this.closed) return
      this.closed = true
      calls.push('session.close')
      this.emit('close')
    }
    onClose(callback) {
      return this.on('close', callback)
    }
  }
  class TargetWatcher {
    constructor(session, options) {
      if (failAt === 'controller') throw new Error('SECRET')
      this.session = session
      this.options = {
        ...options,
        earlyPolicy: options.earlyPolicy,
      }
      this.handlers = new Set()
      this.updates = []
      this.disposals = 0
      this.readiness = managedReady ?? deferred()
      this.ready = this.readiness.promise
      if (!managedReady)
        queueMicrotask(() =>
          failAt === 'watcher-ready'
            ? this.readiness.reject(new Error('SECRET'))
            : this.readiness.resolve(),
        )
      controllers.push(this)
      calls.push('targets.create')
    }
    onEvent(handler) {
      this.handlers.add(handler)
      return () => this.handlers.delete(handler)
    }
    emit(event) {
      for (const handler of this.handlers) handler(event)
    }
    update(policy) {
      this.updates.push({
        ...policy,
        earlyPolicy: policy.earlyPolicy,
      })
      calls.push('targets.update')
      if (this.updateError) throw this.updateError
      return this.updateReady?.promise ?? Promise.resolve()
    }
    dispose() {
      this.disposals++
      this.handlers.clear()
      this.readiness.reject(new Error('Disposed'))
      calls.push('targets.dispose')
    }
    async disposeAsync() {
      this.dispose()
    }
  }
  const sdk = {
    createOverlayProcessPolicy,
    pruneReShadeRuntimeStorage(options) {
      calls.push(['storage.prune', options])
      if (failAt === 'maintenance') return Promise.reject(new Error('SECRET'))
      return maintenanceReady?.promise ?? Promise.resolve({ entries: [] })
    },
    createReShadeLaunchConfig(options) {
      calls.push(['config', JSON.parse(JSON.stringify(options))])
      if (failAt === 'config') throw new Error('SECRET')
      return { runtimeDirectory: 'SDK-owned runtime discovery' }
    },
    OverlayTargetWatcher: TargetWatcher,
    isReShadeOperationError: (error) => error?.sdkError === true,
    ElectronGameOverlay: class {
      constructor(options) {
        calls.push(['owner', { ...options }])
      }
      createSession() {
        return new Session()
      }
      dispose() {
        calls.push('owner.dispose')
      }
    },
  }
  const boundary = (id) => {
    if (id === 'electron-game-overlay') {
      calls.push('sdk.require')
      if (failAt === 'require') throw new Error('SECRET')
      return sdk
    }
    const mocks = {
      electron: {
        BrowserWindow,
        ipcMain,
        app: { getPath: () => '/private/userData' },
      },
      vue: { watch },
      '@/features/game-overlay/store': { useGameOverlayStore: () => store },
      '@/features/databases/store': { useDatabasesStore: () => database },
      '@/electron/overlay-addon-installation': {
        OVERLAY_APPLICATION_ID: 'com.nhs.izabela',
        OverlayAddonSetupError,
        ensureOverlayAddonInstallation() {
          calls.push('addon.setup')
          if (failAt === 'addon-setup')
            return Promise.reject(new OverlayAddonSetupError('SECRET'))
          return preloadReady?.promise ?? Promise.resolve()
        },
      },
      '@/electron/events/main.ts': {
        onIPCGameOverlayStartIntercept: (cb) => ipcMain.on('start', cb),
        onIPCGameOverlayStopIntercept: (cb) => ipcMain.on('stop', cb),
        emitIPCGameOverlayResize: (size) => resizes.push({ ...size }),
      },
    }
    if (Object.hasOwn(mocks, id)) return mocks[id]
    if (['path', 'node:path'].includes(id)) return pathApi
    if (id === 'micromatch') return require(id)
    throw new Error('Forbidden dependency: ' + id)
  }
  boundary.resolve = () => {
    throw new Error('The SDK owns runtime discovery')
  }
  const overlay = loadTypescript(
    filename,
    {},
    {
      require: boundary,
      process: { platform },
      performance: { now: () => time },
      queueMicrotask,
      console: {
        warn: (...args) => logs.push(args),
        error: (...args) => logs.push(args),
        log: (...args) => logs.push(args),
      },
    },
  ).default
  const event = (type = 'connected', pid = 42, cancelled = false) =>
    controllers.at(-1).emit({
      type,
      target: {
        pid,
        executablePath: 'C:/Games/game.exe',
        mode: 'best-effort',
        status: 'connected',
        cancelled,
      },
    })
  const window = () => {
    const value = overlay.createWindow('messenger-game-overlay', {
      webPreferences: { sandbox: true },
    })
    overlay.addOverlayWindow('messenger-game-overlay', value)
    value.finishLoad()
    return value
  }
  return {
    sdk,
    overlay,
    store,
    database,
    calls,
    controllers,
    sessions,
    wrappers,
    resizes,
    logs,
    ipcMain,
    unrelated,
    advance: (milliseconds) => {
      time += milliseconds
    },
    event,
    BrowserWindow,
    window,
  }
}

for (const [name, pathApi] of [
  ['host', path],
  ['win32', path.win32],
]) {
  test(`direct SDK setup and controller readiness own runtime discovery (${name})`, async () => {
    const storeReady = deferred(),
      ready = deferred(),
      managedReady = deferred()
    const f = fixture({
      enabled: true,
      ready,
      managedReady,
      storeReady,
      pathApi,
    })
    const starting = f.overlay.start()
    assert.deepEqual(f.calls, [])
    storeReady.resolve()
    await drain()
    assert.equal(f.sessions.length, 1)
    assert.equal(f.controllers.length, 0)
    ready.resolve()
    await drain()
    assert.equal(f.controllers.length, 1)
    let settled = false
    void starting.then(() => (settled = true))
    await drain()
    assert.equal(settled, false)
    managedReady.resolve()
    assert.equal(await starting, true)
    assert.deepEqual(f.calls.find((c) => c[0] === 'config')[1], {
      runsRootDirectory: pathApi.join(
        '/private/userData',
        'experimental-game-overlay',
        'runs',
      ),
      addonPreload: { applicationId: 'com.nhs.izabela' },
    })
    assert.deepEqual(f.calls.find((c) => c[0] === 'owner')[1], {})
    assert.equal(f.controllers[0].session, f.sessions[0])
    assert.equal(
      f.controllers[0].options.config.runtimeDirectory,
      'SDK-owned runtime discovery',
    )
    await f.overlay.start()
    assert.equal(f.controllers.length, 1)
    f.overlay.quit()
  })
}

test('bounded SDK storage maintenance does not delay target discovery', async () => {
  const maintenanceReady = deferred()
  const f = fixture({ enabled: true, maintenanceReady })
  assert.equal(await f.overlay.start(), true)
  const maintenance = f.calls.filter((call) => call[0] === 'storage.prune')
  assert.equal(maintenance.length, 1)
  assert.equal(maintenance[0][1].config, f.controllers[0].options.config)
  assert.equal(maintenance[0][1].maxRecoveryProbes, 8)
  f.overlay.quit()
  maintenanceReady.resolve()
  await drain()
})

test('storage maintenance failure stays sanitized and leaves discovery running', async () => {
  const f = fixture({ enabled: true, failAt: 'maintenance' })
  assert.equal(await f.overlay.start(), true)
  await drain()
  assert.equal(f.controllers.length, 1)
  assert.equal(f.controllers[0].disposals, 0)
  assert.doesNotMatch(JSON.stringify(f.logs), /SECRET/)
  f.overlay.quit()
})

test('native policy combines configured rules and freezes snapshots without implicit exclusions', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const policy = f.controllers[0].options.earlyPolicy
  const allows = (file) => overlayProcessPolicyAllows(policy, file)
  assert.equal(allows('c:\\games\\.hidden\\GAME.exe'), true)
  assert.equal(allows('D:/Games/database.exe'), true)
  for (const file of [
    'C:/Other/no.exe',
    'C:/Games/blocked.exe',
    'D:/Games/db-blocked.exe',
    'relative.exe',
  ])
    assert.equal(allows(file), false, file)
  assert.deepEqual([...policy.deny], ['**/blocked.exe', '**/db-blocked.exe'])
  assert.equal(f.controllers[0].options.acceptBestEffort, undefined)
  f.store.allowlist = ['E:/New/**']
  await drain()
  assert.equal(
    allows('C:/Games/game.exe'),
    true,
    'Old policy remains immutable',
  )
  const next = f.controllers[0].updates.at(-1).earlyPolicy
  assert.equal(overlayProcessPolicyAllows(next, 'C:/Games/game.exe'), false)
  assert.equal(overlayProcessPolicyAllows(next, 'E:/New/game.exe'), true)
  f.overlay.quit()
})

test('database folder policy still authorizes Gun Frog after its redundant user rule is removed', async () => {
  const f = fixture({ enabled: true })
  const game =
    'C:/Program Files (x86)/Steam/steamapps/common/Gun Frog/Gun Frog.exe'
  f.store.allowlist = ['**/Gun Frog.exe']
  f.database.data['game-overlay-allowlist'] = ['**/steamapps/**']
  await f.overlay.start()
  assert.equal(
    overlayProcessPolicyAllows(f.controllers[0].options.earlyPolicy, game),
    true,
  )
  f.store.allowlist = []
  await drain()
  const next = f.controllers[0].updates.at(-1)
  assert.equal(overlayProcessPolicyAllows(next.earlyPolicy, game), true)
  assert.equal(next.acceptBestEffort, undefined)
  f.database.data['game-overlay-denylist'] = ['**/Gun Frog.exe']
  await drain()
  assert.equal(
    overlayProcessPolicyAllows(
      f.controllers[0].updates.at(-1).earlyPolicy,
      game,
    ),
    false,
  )
  f.overlay.quit()
})

test('SDK policy validation rejects unsupported globs without silently broadening authorization', async () => {
  const f = fixture({ enabled: true })
  f.store.allowlist = ['C:/Games/!(blocked).exe']
  await assert.rejects(f.overlay.start(), /Experimental overlay startup failed/)
  assert.equal(f.controllers.length, 0)
  f.overlay.quit()
})

test('only managed authentication enables input and surface-before-connection ordering is retained', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const window = f.window(),
    wrapper = f.wrappers[0],
    session = f.sessions[0]
  await drain()
  assert.equal(wrapper.visible, false)
  assert.deepEqual(wrapper.follow, { area: 'render' })
  session.emit('targetConnected', {
    pid: 99,
    executablePath: 'C:/Games/game.exe',
  })
  assert.equal(f.overlay.isProcessHooked(99), false)
  session.emit('targetSurfaceChanged', { pid: 42 })
  assert.deepEqual(f.resizes, [])
  f.event()
  assert.equal(f.overlay.isProcessHooked(42), true)
  assert.deepEqual(f.resizes, [{ width: 1280, height: 720 }])
  f.ipcMain.emit('start')
  assert.deepEqual(f.calls.slice(-3), ['show', 'focus', 'intercept'])
  assert.equal(f.overlay.intercepting, false)
  session.emit('inputInterceptionChanged', { pid: 42, intercepting: true })
  assert.equal(f.overlay.intercepting, true)
  f.ipcMain.emit('stop')
  assert.equal(wrapper.visible, false)
  session.emit('inputInterceptionChanged', { pid: 42, intercepting: true })
  assert.equal(f.overlay.intercepting, false)
  f.overlay.quit()
  assert.equal(window.destroyed, true)
  assert.equal(wrapper.destroyed, true)
  assert.deepEqual(f.ipcMain.listeners('start'), [f.unrelated])
  assert.equal(f.ipcMain.listenerCount('stop'), 0)
})

test('shortcut eligibility requires repeated recent FPS from the same connected process', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.window()
  f.event()
  const sample = (fps = 60, pid = 42) => f.sessions[0].emit('fps', { pid, fps })
  const eligible = () => f.overlay.canOpenInGameOverlay(42)

  assert.equal(f.overlay.isProcessHooked(42), true)
  assert.equal(eligible(), false)
  sample(45)
  f.advance(100)
  sample(45)
  f.advance(1969)
  sample(0.955)
  f.advance(31165)
  sample(0.301)
  assert.equal(eligible(), false)

  f.advance(1000)
  sample(60, 99)
  sample()
  assert.equal(eligible(), false)
  f.advance(1000)
  sample()
  assert.equal(eligible(), true)
  assert.equal(f.overlay.canOpenInGameOverlay(99), false)

  f.advance(2001)
  assert.equal(eligible(), false)
  sample()
  f.advance(1000)
  sample(NaN)
  assert.equal(eligible(), false)
  sample()
  f.advance(1000)
  sample()
  assert.equal(eligible(), true)

  f.event('transport-lost')
  f.event()
  assert.equal(eligible(), false)
  f.overlay.quit()
})

test('renderer readiness and late window attachment replay authenticated surface dimensions', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.event()
  f.sessions[0].emit('targetSurfaceChanged', { pid: 42 })
  assert.equal(f.overlay.isProcessHooked(42), false)
  window.finishLoad()
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  await drain()
  assert.equal(f.overlay.isProcessHooked(42), true)
  assert.ok(f.resizes.length)
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  assert.equal(f.wrappers.length, 1)
  f.overlay.quit()
})

for (const kind of ['cancelled', 'exited', 'transport-lost']) {
  test(`managed ${kind} clears hooked state and releases input without consumer reattachment`, async () => {
    const f = fixture({ enabled: true })
    await f.overlay.start()
    f.window()
    f.event()
    f.overlay.startIntercept()
    f.sessions[0].emit('inputInterceptionChanged', {
      pid: 42,
      intercepting: true,
    })
    f.event(kind)
    assert.equal(f.overlay.isProcessHooked(42), false)
    assert.equal(f.overlay.intercepting, false)
    assert.equal(f.wrappers[0].visible, false)
    assert.equal(f.controllers.length, 1)
    assert.equal(f.controllers[0].disposals, 0)
    f.event('connected', 43, true)
    assert.equal(f.overlay.isProcessHooked(43), false)
    f.event()
    assert.equal(f.overlay.isProcessHooked(42), true)
    f.overlay.quit()
  })
}

test('session transport loss and surface removal release interception without implying target exit', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.window()
  f.event()
  const session = f.sessions[0]
  f.overlay.startIntercept()
  session.emit('targetSurfaceRemoved', { pid: 42 })
  assert.equal(f.wrappers[0].visible, false)
  f.overlay.startIntercept()
  session.emit('targetTransportLost', { pid: 42 })
  assert.equal(f.overlay.isProcessHooked(42), false)
  assert.equal(f.controllers[0].disposals, 0)
  f.overlay.quit()
})

test('synchronous policy rejection and asynchronous update failure stay stopped and sanitized', async () => {
  for (const asyncFailure of [false, true]) {
    const f = fixture({ enabled: true })
    await f.overlay.start()
    f.window()
    f.event()
    f.overlay.startIntercept()
    const controller = f.controllers[0]
    if (asyncFailure) {
      controller.updateReady = deferred()
      controller.updateReady.reject(new Error('SECRET'))
    } else controller.updateError = new Error('SECRET')
    f.store.denylist = ['C:/Games/**']
    await drain()
    assert.equal(await f.overlay.isReady(), false)
    assert.equal(f.wrappers[0].visible, false)
    assert.doesNotMatch(JSON.stringify(f.logs), /SECRET/)
    assert.equal(f.controllers.length, 1)
    f.overlay.quit()
  }
})

test('scoped attachment errors retain the controller; fatal controller errors tear down the backend', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.window()
  f.event()
  const controller = f.controllers[0],
    session = f.sessions[0]
  controller.emit({
    type: 'error',
    target: { pid: 42 },
    error: new Error('SECRET'),
  })
  assert.equal(f.overlay.isProcessHooked(42), false)
  assert.equal(controller.disposals, 0)
  controller.emit({ type: 'error', error: new Error('SECRET') })
  assert.equal(controller.disposals, 1)
  assert.equal(session.closed, true)
  assert.equal(await f.overlay.isReady(), false)
  assert.doesNotMatch(JSON.stringify(f.logs), /SECRET/)
  f.overlay.quit()
})

test('another target failure preserves input and permits a fresh target in the same backend', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.window()
  f.event('connected', 42)
  f.overlay.startIntercept()
  const controller = f.controllers[0],
    session = f.sessions[0]
  controller.emit({
    type: 'error',
    target: { pid: 43 },
    error: new Error('controlled target refusal'),
  })
  assert.equal(f.overlay.isProcessHooked(42), true)
  assert.equal(f.wrappers[0].visible, true)
  assert.equal(controller.disposals, 0)
  assert.equal(session.closed, undefined)
  f.event('exited', 43)
  f.event('exited', 42)
  assert.equal(f.overlay.isProcessHooked(42), false)
  f.event('connected', 44)
  f.overlay.startIntercept()
  assert.equal(f.overlay.isProcessHooked(44), true)
  assert.equal(f.wrappers[0].visible, true)
  assert.equal(f.controllers.length, 1)
  assert.equal(f.sessions.length, 1)
  assert.equal(controller.disposals, 0)
  f.overlay.quit()
})

test('blocked future discovery preserves authorized overlay input and reports no raw errors', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.window()
  f.event()
  f.overlay.startIntercept()
  f.sessions[0].emit('inputInterceptionChanged', {
    pid: 42,
    intercepting: true,
  })
  const releases = f.calls.filter((call) => call === 'release').length
  f.controllers[0].emit({
    type: 'discovery-blocked',
    error: new Error('SECRET'),
  })
  assert.equal(f.overlay.isProcessHooked(42), true)
  assert.equal(f.overlay.intercepting, true)
  assert.equal(f.wrappers[0].visible, true)
  assert.equal(f.controllers[0].disposals, 0)
  assert.equal(f.calls.filter((call) => call === 'release').length, releases)
  assert.match(JSON.stringify(f.logs), /Future target discovery blocked/)
  assert.doesNotMatch(JSON.stringify(f.logs), /SECRET/)
  f.overlay.quit()
})

test('SDK diagnostics are bounded and expose classifications without raw errors', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.sessions[0].emit('diagnostic', {
    severity: 'error',
    code: 'runtime-input-routing-failed',
    source: 'electron-game-overlay-runtime',
    pid: 42,
    message: 'SECRET',
    context: { privateToken: 'SECRET' },
  })
  const error = Object.assign(new Error('SECRET'), {
    sdkError: true,
    diagnostic: {
      code: 'target-disconnected',
      stage: 'lifecycle',
      pid: 42,
      privateToken: 'SECRET',
    },
  })
  for (let i = 0; i < 15; i++)
    f.controllers[0].emit({
      type: 'error',
      selector: { processName: 'game.exe' },
      error,
    })
  assert.equal(f.logs.length, 5)
  assert.doesNotMatch(JSON.stringify(f.logs), /SECRET/)
  assert.match(JSON.stringify(f.logs), /target-disconnected/)
  assert.match(JSON.stringify(f.logs), /runtime-input-routing-failed/)
  f.overlay.quit()
})

test('disabling settles controller readiness and late callbacks cannot revive a disposed generation', async () => {
  const pending = deferred(),
    f = fixture({ enabled: true, managedReady: pending })
  const starting = f.overlay.start()
  await drain()
  const controller = f.controllers[0],
    callback = [...controller.handlers][0]
  f.store.enableExperimentalGameOverlay = false
  assert.equal(await starting, false)
  assert.equal(controller.disposals, 1)
  const before = f.calls.length
  callback({ type: 'connected', target: { pid: 42, cancelled: false } })
  pending.resolve()
  await drain()
  assert.equal(f.calls.length, before)
  assert.equal(f.overlay.isProcessHooked(42), false)
  f.overlay.quit()
})

for (const failAt of [
  'require',
  'addon-setup',
  'config',
  'ready',
  'controller',
  'watcher-ready',
]) {
  test(`startup ${failAt} failure rejects sanitized readiness and cleans resources`, async () => {
    const f = fixture({ enabled: true, failAt })
    await assert.rejects(
      f.overlay.start(),
      /Experimental overlay startup failed/,
    )
    assert.equal(await f.overlay.isReady(), false)
    if (f.sessions.length) assert.equal(f.sessions[0].closed, true)
    assert.doesNotMatch(JSON.stringify(f.logs), /SECRET/)
    f.overlay.quit()
  })
}

test('quit during settings, add-on setup or session hydration never starts the managed controller later', async () => {
  for (const phase of ['storeReady', 'preloadReady', 'ready']) {
    const pending = deferred(),
      f = fixture({ enabled: true, [phase]: pending })
    const starting = f.overlay.start()
    await drain()
    f.overlay.quit()
    assert.equal(await starting, false)
    const before = f.calls.length
    pending.resolve()
    await drain()
    assert.equal(f.calls.length, before)
    assert.equal(f.controllers.length, 0)
  }
})

test('preload setup must finish before configuration; disabling cannot resume a stale activation', async () => {
  const preloadReady = deferred()
  const f = fixture({ enabled: true, preloadReady })
  const starting = f.overlay.start()
  await drain()
  assert.ok(f.calls.includes('addon.setup'))
  assert.ok(
    !f.calls.some((call) => Array.isArray(call) && call[0] === 'config'),
  )
  assert.equal(f.sessions.length, 0)
  f.store.enableExperimentalGameOverlay = false
  assert.equal(await starting, false)
  preloadReady.resolve()
  await drain()
  assert.equal(f.controllers.length, 0)
  assert.equal(f.sessions.length, 0)
  f.overlay.quit()
})

test('window lifecycle gates duplicate names and removes only its owned listeners', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const window = f.window()
  assert.throws(
    () => f.overlay.createWindow('messenger-game-overlay', {}),
    /already exists/,
  )
  const lateLoad = window.webContents.listeners('did-finish-load')[0]
  window.destroy()
  lateLoad()
  await drain()
  assert.equal(window.webContents.listenerCount('did-finish-load'), 0)
  const replacement = f.window()
  assert.equal(f.wrappers.length, 2)
  f.overlay.quit()
  assert.equal(replacement.destroyed, true)
})

test('teardown attempts all resources even when the SDK boundary throws', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const callerWindow = new f.BrowserWindow()
  f.overlay.addOverlayWindow('external', callerWindow)
  f.controllers[0].dispose = () => {
    throw new Error('SECRET')
  }
  f.wrappers[0].destroy = () => {
    throw new Error('SECRET')
  }
  f.overlay.quit()
  assert.equal(callerWindow.destroyed, false)
  assert.equal(f.sessions[0].closed, true)
  assert.ok(f.calls.includes('owner.dispose'))
  assert.doesNotMatch(JSON.stringify(f.logs), /SECRET/)
})

test('input interception failure releases and hides instead of escaping the SDK callback', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.window()
  f.event()
  f.sessions[0].input.intercept = () => {
    throw new Error('SECRET')
  }
  assert.doesNotThrow(() => f.overlay.startIntercept())
  assert.equal(f.wrappers[0].visible, false)
  assert.equal(f.overlay.intercepting, false)
  assert.ok(f.calls.includes('release'))
  f.overlay.quit()
})

test('unexpected session close tears down its controller and cannot restart it', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.sessions[0].close()
  assert.equal(f.controllers[0].disposals, 1)
  assert.equal(await f.overlay.isReady(), false)
  await f.overlay.start()
  assert.equal(f.controllers.length, 1)
  f.overlay.quit()
})

test('disabled/non-Windows startup never loads the SDK', async () => {
  for (const options of [{}, { enabled: true, platform: 'linux' }]) {
    const f = fixture(options)
    assert.equal(await f.overlay.start(), false)
    assert.equal(f.calls.length, 0)
    f.overlay.quit()
  }
})

test('quit waits for watcher cleanup already started by disabling the overlay', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const cleanup = deferred()
  const targets = f.controllers[0]
  targets.disposeAsync = () => {
    targets.dispose()
    return cleanup.promise
  }

  f.store.enableExperimentalGameOverlay = false
  assert.equal(targets.disposals, 1)
  let finished = false
  const quitting = f.overlay.quit().then(() => {
    finished = true
  })
  await drain()
  assert.equal(finished, false)
  cleanup.resolve()
  await quitting
  assert.equal(finished, true)
})
