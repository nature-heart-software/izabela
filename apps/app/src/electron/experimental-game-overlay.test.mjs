import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../tests/load-typescript.cjs'

const require = createRequire(import.meta.url)
const { reactive, watch, nextTick } = require('vue')
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
function fixture({
  enabled = false,
  platform = 'win32',
  ready,
  managedReady,
  storeReady,
  failAt,
  pathApi = path,
} = {}) {
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
        earlyTargets: Array.from(options.earlyTargets, (target) => ({
          ...target,
        })),
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
        earlyTargets: Array.from(policy.earlyTargets, (target) => ({
          ...target,
        })),
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
  }
  const sdk = {
    createReShadeLaunchConfig(options) {
      calls.push(['config', { ...options }])
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
    })
    assert.deepEqual(f.calls.find((c) => c[0] === 'owner')[1], {
      allowPrereleaseBroker: true,
    })
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

test('application policy snapshots normalize Windows paths and combine both allow/deny sources', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const policy = f.controllers[0].options,
    allow = (file) => policy.acceptBestEffort({ pid: 42, executablePath: file })
  assert.equal(allow('c:\\games\\.hidden\\GAME.exe'), true)
  assert.equal(allow('D:/Games/database.exe'), true)
  for (const file of [
    'C:/Other/no.exe',
    'C:/Games/blocked.exe',
    'D:/Games/db-blocked.exe',
    'relative.exe',
  ])
    assert.equal(allow(file), false, file)
  assert.deepEqual(policy.earlyTargets, [])
  f.store.allowlist = ['E:/New/**']
  await drain()
  assert.equal(
    allow('C:/Games/game.exe'),
    true,
    'An old policy is immutable while SDK update applies',
  )
  const next = f.controllers[0].updates.at(-1)
  assert.equal(
    next.acceptBestEffort({ executablePath: 'C:/Games/game.exe' }),
    false,
  )
  assert.equal(
    next.acceptBestEffort({ executablePath: 'E:/New/game.exe' }),
    true,
  )
  f.overlay.quit()
})

test('only fully authorized user exact paths or global basenames become early selectors', async () => {
  const f = fixture({ enabled: true })
  f.store.allowlist = [
    'C:\\Games\\Game.exe',
    'C:/Games/blocked.exe',
    'C:/Games/*.exe',
    '**/other.exe',
  ]
  await f.overlay.start()
  assert.deepEqual(f.controllers[0].options.earlyTargets, [
    { processName: 'game.exe', executablePath: 'C:/Games/Game.exe' },
  ])
  f.store.denylist = []
  f.database.data['game-overlay-denylist'] = []
  await drain()
  const current = f.controllers[0].updates.at(-1)
  assert.ok(
    current.earlyTargets.some(
      (t) => t.processName === 'other.exe' && !t.executablePath,
    ),
  )
  f.store.allowlist = ['C:/Games/GAME.exe', '**/game.exe', '**/g?me.exe']
  await drain()
  assert.deepEqual(f.controllers[0].updates.at(-1).earlyTargets, [
    { processName: 'game.exe' },
  ])
  f.overlay.quit()
})

test('database-only allow rules remain best-effort and database policy edits reach the controller', async () => {
  const f = fixture({ enabled: true })
  f.store.allowlist = []
  f.database.data['game-overlay-allowlist'] = ['**/game.exe']
  await f.overlay.start()
  assert.deepEqual(f.controllers[0].options.earlyTargets, [])
  f.database.data['game-overlay-allowlist'] = ['F:/Games/**']
  await drain()
  assert.equal(
    f.controllers[0].updates
      .at(-1)
      .acceptBestEffort({ executablePath: 'F:/Games/game.exe' }),
    true,
  )
  f.database.data['game-overlay-denylist'] = ['F:/Games/**']
  await drain()
  assert.equal(
    f.controllers[0].updates
      .at(-1)
      .acceptBestEffort({ executablePath: 'F:/Games/game.exe' }),
    false,
  )
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

test('SDK diagnostics are bounded and expose classifications without raw errors', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
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

test('quit during settings/session hydration never starts the managed controller later', async () => {
  for (const phase of ['storeReady', 'ready']) {
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
