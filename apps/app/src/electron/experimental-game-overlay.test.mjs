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
} = {}) {
  const calls = [],
    children = [],
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
    }
    prepare() {
      calls.push('prepare')
      return prepared?.promise ?? Promise.resolve()
    }
    attach(session, target) {
      this.attachments.push({ session, target: { ...target } })
      return this.result?.promise ?? Promise.resolve({ pid: target.pid })
    }
    confirmTargetExited(pid) {
      this.exited = pid
    }
    dispose() {
      this.disposed = true
    }
  }
  const sdk = {
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
      return { runtimeDirectory: options.bundledRuntimeDirectory }
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
      child_process: {
        fork: (file, args, options) => {
          if (failAt === 'fork') throw new Error('SECRET')
          calls.push('fork')
          const child = Object.assign(new EventEmitter(), {
            file,
            args,
            options,
            kills: 0,
            kill() {
              this.kills++
            },
          })
          children.push(child)
          return child
        },
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
    if (['path', 'node:path', 'micromatch'].includes(id)) return require(id)
    throw new Error(`Forbidden dependency: ${id}`)
  }
  boundary.resolve = (id) => {
    calls.push(['resolve', id])
    if (id === 'electron-game-overlay/package.json')
      return '/app/resources/app.asar/node_modules/electron-game-overlay/package.json'
    if (id === '@packages/process-watcher')
      return '/app/resources/app.asar/node_modules/@packages/process-watcher/index.js'
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
    children.at(-1).emit('message', {
      type,
      payload: {
        pid,
        process: path.win32.basename(filepath),
        filepath,
        user: 'DO NOT LOG',
      },
    })
  return {
    sdk,
    overlay,
    store,
    database,
    calls,
    children,
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

test('prewarms one session and launcher before arming only the new-process watcher', async () => {
  const ready = deferred(),
    prepared = deferred(),
    storeReady = deferred()
  const f = fixture({ enabled: true, ready, prepared, storeReady })
  const starting = f.overlay.start()
  assert.deepEqual(f.calls, [])
  storeReady.resolve()
  await drain()
  assert.equal(f.sessions.length, 1)
  assert.ok(f.calls.includes('session.start'))
  assert.equal(f.children.length, 0)
  prepared.resolve()
  await drain()
  assert.equal(
    f.children.length,
    0,
    'session readiness is independently required',
  )
  ready.resolve()
  assert.equal(await starting, true)
  assert.equal(await f.overlay.isReady(), true)
  assert.equal(f.children.length, 1)
  const parse = f.calls.find((call) => call[0] === 'parse')
  assert.deepEqual(parse.slice(1), [
    ['--reshade-overlay'],
    {
      bundledRuntimeDirectory:
        '/app/resources/app.asar.unpacked/node_modules/electron-game-overlay/dist/runtime/win32-x64/reshade',
      runsRootDirectory: '/private/userData/experimental-game-overlay/runs',
    },
  ])
  assert.deepEqual(f.calls.find((call) => call[0] === 'owner')[1], {
    allowPrereleaseBroker: true,
  })
  assert.equal(
    f.children[0].file,
    '/app/resources/app.asar.unpacked/node_modules/@packages/process-watcher/index.js',
  )
  assert.equal(f.children[0].options.stdio[3], 'ipc')
  await f.overlay.start()
  assert.equal(f.sessions.length, 1)
  f.overlay.quit()
})

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
  f.children[0].emit('message', {
    type: 'process-creation',
    payload: { pid: 48, process: 'other.exe', filepath: 'C:/Games/game.exe' },
  })
  f.children[0].emit('message', { type: 'process-creation' })
  f.children[0].emit('message', null)
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
    f.children.length,
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
  assert.equal(f.children.length, 0)
  f.store.enableExperimentalGameOverlay = true
  await drain()
  assert.equal(await f.overlay.isReady(), true)
  assert.equal(f.children.length, 1)
  const child = f.children[0],
    session = f.sessions[1]
  const message = child.listeners('message')[0],
    connected = session.listeners('targetConnected')[0],
    input = f.ipcMain.listeners('start').at(-1)
  f.event(42)
  f.overlay.quit()
  f.overlay.quit()
  assert.equal(child.kills, 1)
  assert.equal(child.listenerCount('message'), 0)
  assert.equal(session.eventNames().length, 0)
  assert.equal(await f.overlay.isReady(), false)
  const before = f.calls.length
  message({
    type: 'process-creation',
    payload: { pid: 55, process: 'game.exe', filepath: 'C:/Games/game.exe' },
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
  for (const failAt of ['require', 'parse', 'ready', 'prepare', 'fork']) {
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

test('watcher errors and exit fail closed without restarting or logging process state', async () => {
  for (const event of ['error', 'exit']) {
    const f = fixture({ enabled: true })
    await f.overlay.start()
    const child = f.children[0]
    assert.doesNotThrow(() =>
      child.emit(event, new Error('SECRET account/path'), 1),
    )
    assert.equal(await f.overlay.isReady(), false)
    assert.equal(f.sessions[0].closed, true)
    assert.equal(child.kills, event === 'error' ? 1 : 0)
    f.store.allowlist.push('**')
    await drain()
    assert.equal(f.children.length, 1)
    assert.ok(f.logs.length > 0)
    assert.ok(!JSON.stringify(f.logs).includes('SECRET'))
    f.overlay.quit()
  }
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
  assert.equal(f.children[0].kills, 1)
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
  assert.equal(f.children[0].kills, 1)
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
