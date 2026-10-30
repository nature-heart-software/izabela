import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

function fixture() {
  const screen = new EventEmitter()
  const windows = []
  const attached = []
  let ready
  let rejectReady
  let failLoad = false
  const nativeReady = new Promise((resolve, reject) => {
    ready = resolve
    rejectReady = reject
  })
  const createWindow = loadTypescript(
    fileURLToPath(new URL('./overlay-window.ts', import.meta.url)),
    {
      electron: { screen },
      'electron-postman': { ipcMain: { registerBrowserWindow() {} } },
      '@/electron/utils': {
        createProtocol() {},
        getLargestMonitorSize: () => ({ width: 1920, height: 1080 }),
      },
      '@/electron/game-overlay-backend': {
        createWindow() {
          const window = new EventEmitter()
          Object.assign(window, {
            webContents: { setMaxListeners() {}, setFrameRate() {} },
            destroyed: false,
            isDestroyed() {
              return this.destroyed
            },
            destroy() {
              this.destroyed = true
              this.emit('closed')
            },
            setBounds() {
              assert.equal(this.destroyed, false)
            },
            setSize() {
              assert.equal(this.destroyed, false)
            },
            async loadURL() {
              if (failLoad) throw new Error('controlled load failure')
            },
          })
          windows.push(window)
          return window
        },
        isReady: () => nativeReady,
        addOverlayWindow: (...args) => attached.push(args),
      },
    },
    { __dirname: 'fixture', console: { error() {} } },
  ).default
  return {
    createWindow,
    screen,
    windows,
    attached,
    ready,
    rejectReady,
    fail: () => (failLoad = true),
  }
}

test('destroying an optional overlay removes its display listener', async () => {
  const f = fixture()
  const window = await f.createWindow('messenger-game-overlay')
  assert.equal(f.screen.listenerCount('display-metrics-changed'), 1)
  window.destroy()
  assert.equal(f.screen.listenerCount('display-metrics-changed'), 0)
  f.screen.emit('display-metrics-changed')
})

test('late native readiness cannot attach a destroyed overlay or attach its replacement twice', async () => {
  const f = fixture()
  const old = await f.createWindow('messenger-game-overlay')
  old.destroy()
  const replacement = await f.createWindow('messenger-game-overlay')
  f.ready()
  await Promise.resolve()
  assert.equal(f.attached.length, 1)
  assert.equal(f.attached[0][1], replacement)
  replacement.destroy()
})

test('failed renderer loading destroys its window and removes display listeners', async () => {
  const f = fixture()
  f.fail()
  await assert.rejects(
    f.createWindow('messenger-game-overlay'),
    /controlled load failure/,
  )
  assert.equal(f.windows[0].isDestroyed(), true)
  assert.equal(f.screen.listenerCount('display-metrics-changed'), 0)
})

test('failed backend readiness destroys the renderer instead of retaining it', async () => {
  const f = fixture()
  const window = await f.createWindow('messenger-game-overlay')
  f.rejectReady(new Error('controlled startup failure'))
  await new Promise(setImmediate)
  assert.equal(window.isDestroyed(), true)
  assert.equal(f.attached.length, 0)
  assert.equal(f.screen.listenerCount('display-metrics-changed'), 0)
})
