import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { existsSync } from 'node:fs'
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
  return { promise, resolve, reject }
}

function fixture({
  enabled = false,
  platform = 'win32',
  ready,
  prepared,
  storeReady,
  failAt,
  pathApi = path,
  observerReady = true,
  earlyWatcherReady = true,
} = {}) {
  const calls = [],
    observers = [],
    launchers = [],
    sessions = [],
    wrappers = [],
    resizes = [],
    logs = []
  const ipcMain = new EventEmitter()
  const unrelated = () => {}
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
    close() {
      this.destroy()
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
              this.follow = options
              calls.push('follow')
            },
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
  class Launcher {
    constructor(config) {
      this.config = config
      this.attachments = []
      launchers.push(this)
      this.events = new Set()
    }
    onEvent(callback) {
      this.events.add(callback)
      return () => this.events.delete(callback)
    }
    prepare() {
      calls.push('prepare')
      return prepared?.promise ?? Promise.resolve()
    }
    attach(session, target) {
      this.attachments.push({ session, target: { ...target } })
      if (target.pid === undefined) {
        this.pendingAttach = deferred()
        if (earlyWatcherReady)
          queueMicrotask(() => {
            for (const event of this.events)
              event({ type: 'injector-watcher-ready' })
          })
        return this.pendingAttach.promise
      }
      return this.result?.promise ?? Promise.resolve({ pid: target.pid })
    }
    confirmTargetExited(pid) {
      this.exited = pid
    }
    dispose() {
      this.disposed = true
      this.pendingAttach?.reject(new Error('Disposed'))
    }
  }
  const sdk = {
    observeOverlayProcesses(options) {
      if (failAt === 'observe') throw new Error('SECRET')
      calls.push('observe')
      const readiness = deferred()
      void readiness.promise.catch(() => {})
      const observer = {
        options,
        ready: readiness.promise,
        resolveReady: readiness.resolve,
        disposals: 0,
        dispose() {
          if (this.disposals) return
          this.disposals++
          readiness.reject(new Error('Disposed'))
        },
      }
      observers.push(observer)
      if (observerReady) queueMicrotask(readiness.resolve)
      return observer
    },
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
    ReShadeOverlayLauncher: Launcher,
    parseReShadeLaunchConfig(argv, options) {
      calls.push(['parse', [...argv], { ...options }])
      if (failAt === 'parse') throw new Error('SECRET')
      return {
        runtimeDirectory: options.bundledRuntimeDirectory,
        injectorPath: 'C:/sdk/inject.exe',
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
        onIPCGameOverlayStartIntercept: (callback) =>
          ipcMain.on('start', callback),
        onIPCGameOverlayStopIntercept: (callback) =>
          ipcMain.on('stop', callback),
        emitIPCGameOverlayResize: (size) => resizes.push({ ...size }),
      },
    }
    if (Object.hasOwn(mocks, id)) return mocks[id]
    if (['path', 'node:path'].includes(id)) return pathApi
    if (id === 'micromatch') return require(id)
    throw new Error(`Forbidden dependency: ${id}`)
  }
  boundary.resolve = (id) => {
    calls.push(['resolve', id])
    if (id === 'electron-game-overlay/package.json')
      return '/app/resources/app.asar/node_modules/electron-game-overlay/package.json'
    throw new Error(`Forbidden resolution: ${id}`)
  }
  assert.ok(existsSync(filename), 'experimental adapter must exist')
  const overlay = loadTypescript(
    filename,
    {},
    {
      require: boundary,
      process: { platform, resourcesPath: '/app/resources' },
      queueMicrotask,
      console: {
        warn: (...args) => logs.push(args),
        error: (...args) => logs.push(args),
        log: (...args) => logs.push(args),
      },
    },
  ).default
  const event = (
    pid,
    filepath = 'C:/Games/game.exe',
    type = 'process-creation',
  ) =>
    observers
      .at(-1)
      .options[type === 'process-creation' ? 'onCreated' : 'onExited']({
        pid,
        executablePath: filepath,
        creationTime100ns: '133000000000000000',
      })
  return {
    sdk,
    overlay,
    store,
    database,
    calls,
    observers,
    launchers,
    sessions,
    wrappers,
    resizes,
    logs,
    ipcMain,
    unrelated,
    event,
    BrowserWindow,
  }
}

for (const [pathName, pathApi] of [
  ['host', path],
  ['win32', path.win32],
]) {
  test(`prewarms one session and launcher before arming only the new-process watcher (${pathName})`, async () => {
    const ready = deferred(),
      prepared = deferred(),
      storeReady = deferred()
    const f = fixture({ enabled: true, ready, prepared, storeReady, pathApi })
    const starting = f.overlay.start()
    assert.deepEqual(f.calls, [])
    storeReady.resolve()
    await drain()
    assert.equal(f.sessions.length, 1)
    assert.ok(f.calls.includes('session.start'))
    assert.equal(f.observers.length, 0)
    prepared.resolve()
    await drain()
    assert.equal(
      f.observers.length,
      0,
      'session readiness is independently required',
    )
    ready.resolve()
    assert.equal(await starting, true)
    assert.equal(await f.overlay.isReady(), true)
    assert.equal(f.observers.length, 1)
    const parse = f.calls.find((call) => call[0] === 'parse')
    assert.deepEqual(parse.slice(1), [
      ['--reshade-overlay'],
      {
        bundledRuntimeDirectory: pathApi.join(
          '/app/resources/app.asar.unpacked/node_modules/electron-game-overlay',
          'dist',
          'runtime',
          'win32-x64',
          'reshade',
        ),
        runsRootDirectory: pathApi.join(
          '/private/userData',
          'experimental-game-overlay',
          'runs',
        ),
      },
    ])
    assert.deepEqual(f.calls.find((call) => call[0] === 'owner')[1], {
      allowPrereleaseBroker: true,
    })
    assert.equal(
      f.observers[0].options.runtimeDirectory,
      f.launchers[0].config.runtimeDirectory,
    )
    assert.equal(f.calls.filter((call) => call === 'observe').length, 1)
    await f.overlay.start()
    assert.equal(f.sessions.length, 1)
    f.overlay.quit()
  })
}

test('new-PID policy combines database rules, deduplicates failures, and cleans exact deletions', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const first = f.launchers[0]
  first.result = deferred()
  f.event(42)
  f.event(42)
  f.event(43, 'D:/Games/database.exe')
  f.event(44, 'C:/Other/no.exe')
  f.event(45, 'C:/Games/blocked.exe')
  f.event(46, 'D:/Games/db-blocked.exe')
  f.event(-1)
  f.event(1.5)
  f.event(47, 'relative.exe')
  assert.equal(first.attachments.length, 1)
  assert.deepEqual(first.attachments[0].target, {
    pid: 42,
    processName: 'game.exe',
    executablePath: 'C:/Games/game.exe',
  })
  assert.equal(f.launchers.length, 2)
  assert.deepEqual(f.launchers[1].attachments[0].target, {
    pid: 43,
    processName: 'database.exe',
    executablePath: 'D:/Games/database.exe',
  })
  first.result.reject(new Error('secret runtime path and token'))
  await drain()
  f.event(42)
  assert.equal(first.attachments.length, 1, 'uncertainty never retries')
  f.store.allowlist.push('E:/Games/**')
  f.event(49, 'E:/Games/new.exe')
  assert.equal(
    f.observers.length,
    1,
    'policy changes do not restart watcher or scan',
  )
  assert.equal(f.launchers.length, 3)
  f.event(42, 'C:/Games/game.exe', 'process-deletion')
  assert.equal(first.exited, 42)
  assert.equal(first.disposed, true)
  f.event(42)
  assert.equal(
    f.launchers.length,
    4,
    'authoritative deletion permits a future new process instance',
  )
  assert.ok(!JSON.stringify(f.logs).includes('secret'))
  f.overlay.quit()
})

test('SDK attachment stays hidden; only authenticated sessions and explicit IPC request input', async () => {
  const f = fixture({ enabled: true })
  assert.equal(f.ipcMain.listenerCount('start'), 1)
  await f.overlay.start()
  assert.equal(f.ipcMain.listenerCount('start'), 2)
  const window = f.overlay.createWindow('messenger-game-overlay', {
    show: true,
    width: 800,
    height: 600,
    webPreferences: { sandbox: true },
  })
  assert.equal(window.options.show, false)
  assert.equal(window.options.webPreferences.offscreen, true)
  assert.equal(window.options.webPreferences.sandbox, true)
  f.overlay.addOverlayWindow('messenger-game-overlay', window, 2, 20, true)
  const wrapper = f.wrappers[0]
  wrapper.getBounds = () => ({ x: 0, y: 0, width: 1280, height: 720 })
  assert.deepEqual(
    { ...wrapper.options },
    {
      id: 'messenger-game-overlay',
      name: 'messenger-game-overlay',
      dragBorder: 2,
      captionHeight: 20,
      transparent: true,
      focusOnReady: false,
    },
  )
  assert.equal(wrapper.visible, false)
  assert.deepEqual({ ...wrapper.follow }, { area: 'render' })
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  assert.equal(f.wrappers.length, 1)
  f.event(42)
  await drain()
  assert.equal(
    f.overlay.isProcessHooked(42),
    false,
    'successful launcher return is not connection evidence',
  )
  const session = f.sessions[0]
  session.emit('targetConnected', {
    pid: 99,
    executablePath: 'C:/Games/other.exe',
  })
  session.emit('targetConnected', {
    pid: 42,
    executablePath: 'C:/Games/game.exe',
  })
  assert.equal(
    f.overlay.isProcessHooked(42),
    false,
    'renderer is still loading',
  )
  session.emit('targetSurfaceChanged', {
    pid: 42,
    surfaceId: '0x1',
    renderSize: { width: 2560, height: 1440 },
  })
  assert.deepEqual(f.resizes, [])
  window.finishLoad()
  await drain()
  assert.deepEqual(
    f.resizes,
    [{ width: 1280, height: 720 }],
    'renderer receives SDK-followed DIP size after its IPC registration',
  )
  assert.equal(f.overlay.isProcessHooked(42), true)
  assert.equal(f.overlay.isProcessHooked(99), false)
  f.ipcMain.emit('start')
  assert.deepEqual(f.calls.slice(-3), ['show', 'focus', 'intercept'])
  assert.equal(f.overlay.intercepting, false, 'request is not acknowledgement')
  session.emit('inputInterceptionChanged', { pid: 42, intercepting: true })
  assert.equal(f.overlay.intercepting, true)
  f.ipcMain.emit('stop')
  assert.equal(wrapper.visible, false)
  assert.equal(f.overlay.intercepting, false)
  session.emit('inputInterceptionChanged', { pid: 42, intercepting: true })
  assert.equal(
    f.overlay.intercepting,
    false,
    'late acknowledgements cannot restart input',
  )
  session.emit('targetTransportLost', { pid: 42 })
  assert.equal(f.overlay.isProcessHooked(42), false)
  f.overlay.quit()
  assert.equal(window.isDestroyed(), true)
  assert.equal(wrapper.destroyed, true)
  assert.deepEqual(f.ipcMain.listeners('start'), [f.unrelated])
  assert.equal(f.ipcMain.listenerCount('stop'), 0)
})

test('disabling cancels pending readiness and quit gates every retained late callback', async () => {
  const ready = deferred(),
    prepared = deferred()
  const f = fixture({ ready, prepared })
  await f.overlay.start()
  f.store.enableExperimentalGameOverlay = true
  await drain()
  assert.equal(f.sessions.length, 1)
  const pending = f.overlay.isReady()
  f.store.enableExperimentalGameOverlay = false
  assert.equal(
    await Promise.race([
      pending,
      new Promise((resolve) => setTimeout(() => resolve('hung'), 100)),
    ]),
    false,
  )
  assert.equal(f.sessions[0].closed, true)
  assert.equal(f.launchers[0].disposed, true)
  ready.resolve()
  prepared.resolve()
  await drain()
  assert.equal(f.observers.length, 0)
  f.store.enableExperimentalGameOverlay = true
  await drain()
  assert.equal(await f.overlay.isReady(), true)
  assert.equal(f.observers.length, 1)
  const observer = f.observers[0],
    session = f.sessions[1]
  const created = observer.options.onCreated,
    connected = session.listeners('targetConnected')[0],
    input = f.ipcMain.listeners('start').at(-1)
  f.event(42)
  f.overlay.quit()
  f.overlay.quit()
  assert.equal(observer.disposals, 1)
  assert.equal(session.eventNames().length, 0)
  assert.equal(await f.overlay.isReady(), false)
  const before = f.calls.length
  created({
    pid: 55,
    executablePath: 'C:/Games/game.exe',
    creationTime100ns: '133000000000000001',
  })
  connected({ pid: 42 })
  input()
  f.store.enableExperimentalGameOverlay = false
  f.store.enableExperimentalGameOverlay = true
  await f.overlay.start()
  await drain()
  assert.equal(f.calls.length, before)
  assert.equal(f.overlay.isProcessHooked(42), false)
})

test('startup failures reject sanitized readiness and close every allocated resource', async () => {
  for (const failAt of ['require', 'parse', 'ready', 'prepare', 'observe']) {
    const ready = deferred(),
      prepared = deferred()
    const f = fixture({ enabled: true, ready, prepared, failAt })
    const starting = f.overlay.start()
    const rejection = assert.rejects(
      starting,
      /Experimental overlay startup failed/,
    )
    await drain()
    if (failAt === 'ready') ready.reject(new Error('SECRET'))
    else ready.resolve()
    if (failAt === 'prepare') prepared.reject(new Error('SECRET'))
    else prepared.resolve()
    await rejection
    assert.equal(await f.overlay.isReady(), false)
    assert.ok(f.sessions.every((session) => session.closed))
    assert.ok(f.launchers.every((launcher) => launcher.disposed))
    assert.deepEqual(f.ipcMain.listeners('start'), [f.unrelated])
    assert.equal(f.ipcMain.listenerCount('stop'), 0)
    assert.ok(!JSON.stringify(f.logs).includes('SECRET'))
    f.overlay.quit()
  }
})

test('authoritative deletion clears hooked/input state and late launcher rejection is inert', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  window.finishLoad()
  const launcher = f.launchers[0]
  launcher.result = deferred()
  f.event(42)
  f.sessions[0].emit('targetConnected', { pid: 42 })
  f.overlay.startIntercept()
  f.sessions[0].emit('inputInterceptionChanged', {
    pid: 42,
    intercepting: true,
  })
  f.event(42, 'C:/Games/game.exe', 'process-deletion')
  assert.equal(f.overlay.isProcessHooked(42), false)
  assert.equal(f.overlay.intercepting, false)
  assert.equal(f.wrappers[0].visible, false)
  f.overlay.quit()
  const before = f.logs.length
  launcher.result.reject(new Error('late SECRET'))
  await drain()
  assert.equal(f.logs.length, before)
})

test('public observer failure stops the session without fabricating target exit or retrying', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.event(42)
  const observer = f.observers[0]
  assert.doesNotThrow(() =>
    observer.options.onError(new Error('SECRET account/path')),
  )
  assert.equal(await f.overlay.isReady(), false)
  assert.equal(f.sessions[0].closed, true)
  assert.equal(observer.disposals, 1)
  assert.equal(f.launchers[0].exited, undefined)
  f.store.allowlist.push('**')
  await drain()
  assert.equal(f.observers.length, 1)
  assert.ok(f.logs.length > 0)
  assert.ok(!JSON.stringify(f.logs).includes('SECRET'))
  f.overlay.quit()
})

test('diagnostic bursts are bounded and input failure releases/hides before returning', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const session = f.sessions[0]
  for (let i = 0; i < 20; i++)
    session.emit('diagnostic', {
      severity: 'error',
      message: 'SECRET',
      context: { token: 'SECRET' },
    })
  assert.equal(f.logs.length, 5)
  assert.ok(!JSON.stringify(f.logs).includes('SECRET'))
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  window.finishLoad()
  f.event(42)
  session.emit('targetConnected', { pid: 42 })
  session.input.intercept = () => {
    throw new Error('SECRET')
  }
  assert.doesNotThrow(() => f.overlay.startIntercept())
  assert.equal(f.overlay.intercepting, false)
  assert.equal(f.wrappers[0].visible, false)
  f.overlay.quit()
})

test('teardown attempts all owned resources despite boundary errors and leaves caller windows open', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const owned = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', owned)
  const caller = new f.BrowserWindow({ webPreferences: { offscreen: true } })
  f.overlay.addOverlayWindow('caller', caller)
  f.event(42)
  f.wrappers[0].destroy = () => {
    throw new Error('SECRET')
  }
  f.launchers[0].dispose = () => {
    f.launchers[0].disposed = true
    throw new Error('SECRET')
  }
  f.sessions[0].input.release = () => {
    throw new Error('SECRET')
  }
  assert.doesNotThrow(() => f.overlay.quit())
  assert.equal(owned.isDestroyed(), true)
  assert.equal(caller.isDestroyed(), false)
  assert.equal(caller.listenerCount('closed'), 0)
  assert.equal(caller.webContents.listenerCount('did-finish-load'), 0)
  assert.equal(f.wrappers[1].destroyed, true)
  assert.equal(f.sessions[0].closed, true)
  assert.equal(f.observers[0].disposals, 1)
  assert.ok(f.calls.includes('owner.dispose'))
  assert.ok(!JSON.stringify(f.logs).includes('SECRET'))
})

test('quit settles held settings hydration without allowing its late success or rejection to load SDK', async () => {
  for (const reject of [false, true]) {
    const storeReady = deferred()
    const f = fixture({ enabled: true, storeReady })
    const starting = f.overlay.start()
    f.overlay.quit()
    assert.equal(
      await Promise.race([
        starting,
        new Promise((resolve) => setTimeout(() => resolve('hung'), 100)),
      ]),
      false,
    )
    if (reject) storeReady.reject(new Error('SECRET'))
    else storeReady.resolve()
    await drain()
    assert.deepEqual(f.calls, [])
  }
})

test('legacy-shaped window factory can create before readiness without loading SDK itself', async () => {
  const storeReady = deferred(),
    ready = deferred()
  const f = fixture({ enabled: true, storeReady, ready })
  const starting = f.overlay.start()
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  assert.deepEqual(f.calls, ['window'])
  let settled = false
  const waiting = f.overlay.isReady().then((result) => {
    settled = true
    return result
  })
  await drain()
  assert.equal(settled, false)
  storeReady.resolve()
  await drain()
  assert.equal(settled, false)
  ready.resolve()
  assert.equal(await starting, true)
  assert.equal(await waiting, true)
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  f.overlay.quit()
})

test('surface removal releases input and duplicate owned names do not leak another BrowserWindow', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  window.finishLoad()
  f.event(42)
  const session = f.sessions[0]
  session.emit('targetConnected', { pid: 42 })
  f.overlay.startIntercept()
  session.emit('targetSurfaceRemoved', { pid: 42, surfaceId: '0x1' })
  assert.equal(f.wrappers[0].visible, false)
  const count = f.calls.filter((call) => call === 'window').length
  assert.throws(
    () => f.overlay.createWindow('messenger-game-overlay', {}),
    /already exists/,
  )
  assert.equal(f.calls.filter((call) => call === 'window').length, count)
  f.overlay.quit()
})

test('synchronous launcher failures remain deduplicated and deletion still completes cleanup', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  let attempts = 0
  f.launchers[0].attach = () => {
    attempts++
    throw new Error('SECRET')
  }
  f.event(42)
  f.event(42)
  assert.equal(attempts, 1)
  f.launchers[0].dispose = () => {
    throw new Error('SECRET')
  }
  assert.doesNotThrow(() =>
    f.event(42, 'C:/Games/game.exe', 'process-deletion'),
  )
  let constructions = 0
  f.sdk.ReShadeOverlayLauncher = class {
    constructor() {
      constructions++
      throw new Error('SECRET')
    }
  }
  assert.doesNotThrow(() => f.event(43))
  assert.doesNotThrow(() => f.event(43))
  assert.equal(constructions, 1)
  f.overlay.quit()
})

test('closed-window cleanup survives SDK failure and rejects stale load callbacks for its replacement', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  const lateLoad = window.webContents.listeners('did-finish-load')[0]
  f.wrappers[0].destroy = () => {
    throw new Error('SECRET')
  }
  assert.doesNotThrow(() => window.destroy())
  assert.equal(window.webContents.listenerCount('did-finish-load'), 0)
  const replacement = f.overlay.createWindow('messenger-game-overlay', {})
  assert.notEqual(replacement, window)
  lateLoad()
  await drain()
  assert.deepEqual(f.resizes, [])
  f.overlay.quit()
})

test('unexpected public session closure tears down its retained watcher without reactivation', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.sessions[0].close()
  assert.equal(await f.overlay.isReady(), false)
  assert.equal(f.observers[0].disposals, 1)
  assert.deepEqual(f.ipcMain.listeners('start'), [f.unrelated])
  await f.overlay.start()
  assert.equal(f.sessions.length, 1)
  f.overlay.quit()
})

test('target resize boundary errors are bounded instead of escaping SDK callbacks', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  window.finishLoad()
  f.event(42)
  const session = f.sessions[0]
  session.emit('targetConnected', { pid: 42 })
  f.wrappers[0].getBounds = () => {
    throw new Error('SECRET')
  }
  assert.doesNotThrow(() => session.emit('targetSurfaceChanged', { pid: 42 }))
  await drain()
  assert.ok(f.logs.length > 0)
  assert.ok(!JSON.stringify(f.logs).includes('SECRET'))
  f.overlay.quit()
})

test('attachment after renderer load replays a target observed before the wrapper existed', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.event(42)
  f.sessions[0].emit('targetConnected', { pid: 42 })
  f.sessions[0].emit('targetSurfaceChanged', { pid: 42 })
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  window.finishLoad()
  await drain()
  assert.deepEqual(f.resizes, [])
  const attach = f.sessions[0].windows.attach
  f.sessions[0].windows.attach = (...args) => {
    const wrapper = attach(...args)
    wrapper.getBounds = () => ({ width: 1600, height: 900 })
    return wrapper
  }
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  assert.deepEqual(f.resizes, [{ width: 1600, height: 900 }])
  f.overlay.quit()
})

test('disabled and non-Windows startup never loads SDK or starts native work', async () => {
  for (const options of [{}, { enabled: true, platform: 'linux' }]) {
    const f = fixture(options)
    assert.deepEqual(f.calls, [])
    await f.overlay.start()
    await drain()
    assert.deepEqual(f.calls, [])
    assert.equal(await f.overlay.isReady(), false)
    f.overlay.quit()
  }
})

test('attachment failures preserve SDK classifications without logging private error fields', async () => {
  const f = fixture({ enabled: true })
  await f.overlay.start()
  f.launchers[0].result = deferred()
  f.event(42)
  f.launchers[0].result.reject({
    sdkError: true,
    message: 'SECRET',
    diagnostic: {
      code: 'runtime-initialization-timeout',
      stage: 'runtime-initialization',
      pid: 42,
      runtimeStartupCode: 'not-observed',
      evidence: { runDirectory: 'SECRET' },
    },
  })
  await drain()
  assert.deepEqual(
    { ...f.logs[0][1] },
    {
      code: 'runtime-initialization-timeout',
      stage: 'runtime-initialization',
      pid: 42,
      runtimeStartupCode: 'not-observed',
    },
  )
  assert.ok(!JSON.stringify(f.logs).includes('SECRET'))
  f.overlay.quit()
})

test('readiness waits for the native observer handshake and quit cancels that wait', async () => {
  for (const cancel of [false, true]) {
    const f = fixture({ enabled: true, observerReady: false })
    let settled = false
    const starting = f.overlay.start().then((result) => {
      settled = true
      return result
    })
    await drain()
    assert.equal(f.observers.length, 1)
    assert.equal(settled, false)
    if (cancel) f.overlay.quit()
    else f.observers[0].resolveReady()
    assert.equal(await starting, !cancel)
    f.overlay.quit()
  }
})

function earlyFixture(options) {
  const f = fixture({ enabled: true, ...options })
  f.store.allowlist = ['**/fast.exe']
  f.store.denylist = []
  f.database.data['game-overlay-denylist'] = []
  return f
}

test('explicit basename rules arm before readiness and never start a competing exact-PID injection', async () => {
  const f = earlyFixture()
  assert.equal(await f.overlay.start(), true)
  const launcher = f.launchers[0]
  assert.deepEqual(
    { ...launcher.attachments[0].target },
    { processName: 'fast.exe' },
  )
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  window.finishLoad()
  f.event(42, 'C:\\Users\\User\\.games\\FAST.EXE')
  assert.equal(launcher.attachments.length, 1)
  assert.equal(f.launchers.length, 1)
  f.sessions[0].emit('targetConnected', {
    pid: 42,
    executablePath: 'C:\\Users\\User\\.games\\FAST.EXE',
  })
  assert.equal(f.overlay.isProcessHooked(42), true)
  f.overlay.startIntercept()
  assert.deepEqual(f.calls.slice(-3), ['show', 'focus', 'intercept'])
  f.overlay.quit()
  await drain()
  assert.equal(launcher.events.size, 0)
})

test('early authentication can precede watcher output and confirmed exit rearms a fresh launcher', async () => {
  const f = earlyFixture()
  await f.overlay.start()
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  window.finishLoad()
  f.sessions[0].emit('targetConnected', {
    pid: 42,
    executablePath: 'C:/Games/fast.exe',
  })
  assert.equal(f.overlay.isProcessHooked(42), true)
  f.event(42, 'C:/Games/fast.exe')
  assert.equal(f.launchers.length, 1)
  f.event(42, 'C:/Games/fast.exe', 'process-deletion')
  await drain()
  assert.equal(f.launchers[0].exited, 42)
  assert.equal(f.launchers[0].disposed, true)
  assert.equal(f.launchers.length, 2)
  assert.deepEqual(
    { ...f.launchers[1].attachments[0].target },
    { processName: 'fast.exe' },
  )
  f.event(43, 'C:/Games/fast.exe')
  assert.equal(f.launchers.length, 2)
  f.overlay.quit()
})

test('restricted paths, wildcard basenames and either denylist never authorize a native name watcher', async () => {
  for (const policy of [
    'folder',
    'glob',
    'deny',
    'database-deny',
    'database-name',
  ]) {
    const f = earlyFixture()
    if (policy === 'folder') f.store.allowlist = ['C:/Games/*.exe']
    if (policy === 'glob') f.store.allowlist = ['**/fast*.exe']
    if (policy === 'deny') f.store.denylist = ['**/protected/**']
    if (policy === 'database-deny')
      f.database.data['game-overlay-denylist'] = ['**/protected/**']
    if (policy === 'database-name') {
      f.store.allowlist = []
      f.database.data['game-overlay-allowlist'] = ['**/fast.exe']
    }
    await f.overlay.start()
    assert.equal(f.launchers[0].attachments.length, 0, policy)
    f.event(42, 'C:/Games/fast.exe')
    assert.equal(f.launchers[0].attachments[0].target.pid, 42, policy)
    f.overlay.quit()
  }
})

test('an exact executable prearms only its permitted path while retaining unrelated deny rules', async () => {
  const f = fixture({ enabled: true })
  f.store.allowlist = ['C:\\Games\\fast.exe']
  assert.equal(await f.overlay.start(), true)
  const window = f.overlay.createWindow('messenger-game-overlay', {})
  f.overlay.addOverlayWindow('messenger-game-overlay', window)
  window.finishLoad()
  const launcher = f.launchers[0]
  assert.deepEqual(launcher.attachments[0].target, {
    processName: 'fast.exe',
    executablePath: 'C:/Games/fast.exe',
  })
  f.event(42, 'C:\\Games\\fast.exe')
  assert.equal(
    launcher.attachments.length,
    1,
    'no competing exact-PID attachment',
  )
  f.sessions[0].emit('targetConnected', {
    pid: 42,
    executablePath: 'C:\\Games\\fast.exe',
  })
  assert.equal(f.overlay.isProcessHooked(42), true)
  f.event(42, 'C:\\Games\\fast.exe', 'process-deletion')
  await drain()
  assert.equal(
    f.launchers[1].attachments[0].target.executablePath,
    'C:/Games/fast.exe',
  )
  f.overlay.quit()
})

test('a denied exact executable never prearms and a global basename does not duplicate exact watchers', async () => {
  const denied = fixture({ enabled: true })
  denied.store.allowlist = ['C:/Games/blocked.exe']
  await denied.overlay.start()
  assert.equal(denied.launchers[0].attachments.length, 0)
  denied.event(42, 'C:/Games/blocked.exe')
  assert.equal(denied.launchers[0].attachments.length, 0)
  denied.overlay.quit()
  const f = earlyFixture()
  f.store.allowlist.push('C:/Games/fast.exe', 'c:/games/fast.exe')
  await f.overlay.start()
  assert.equal(f.launchers.length, 1)
  assert.deepEqual(f.launchers[0].attachments[0].target, {
    processName: 'fast.exe',
  })
  f.overlay.quit()
})

test('policy edits cancel early injection until restart', async () => {
  const f = earlyFixture()
  await f.overlay.start()
  const launcher = f.launchers[0]
  f.store.denylist.push('**/elsewhere/**')
  assert.equal(launcher.disposed, true, 'policy change cancels synchronously')
  f.event(42, 'C:/Games/fast.exe')
  await drain()
  assert.equal(
    f.launchers.length,
    1,
    'uncertain watcher is never replaced automatically',
  )
  assert.equal(launcher.attachments.length, 1)
  f.sessions[0].emit('targetConnected', {
    pid: 42,
    executablePath: 'C:/Games/fast.exe',
  })
  assert.equal(f.overlay.isProcessHooked(42), false)
  f.overlay.quit()
})

test('quit cancels held native-name readiness without starting an exact fallback', async () => {
  const f = earlyFixture({ earlyWatcherReady: false })
  let settled = false
  const starting = f.overlay.start().then((value) => {
    settled = true
    return value
  })
  await drain()
  assert.equal(settled, false)
  assert.equal(f.launchers[0].attachments.length, 1)
  f.overlay.quit()
  assert.equal(await starting, false)
  await drain()
  assert.equal(f.launchers[0].events.size, 0)
})

test('database hydration does not cancel an explicitly allowed name unless it adds a deny rule', async () => {
  const f = earlyFixture()
  f.database.data = {}
  await f.overlay.start()
  const launcher = f.launchers[0]
  f.database.data['game-overlay-allowlist'] = ['**/steamapps/**']
  f.database.data['game-overlay-denylist'] = []
  await drain()
  assert.notEqual(launcher.disposed, true)
  f.database.data['game-overlay-denylist'] = ['**/protected/**']
  assert.equal(launcher.disposed, true)
  f.overlay.quit()
})
