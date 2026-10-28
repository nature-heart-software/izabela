import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

test('off-screen worker starts native speech after loading without waiting for a paint', async () => {
  let window
  const started = []
  let resolveLoad
  const loaded = new Promise((resolve) => {
    resolveLoad = resolve
  })
  class Window extends EventEmitter {
    constructor() {
      super()
      window = this
      this.webContents = { setMaxListeners() {}, setBackgroundThrottling() {} }
    }
    setAlwaysOnTop() {}
    setVisibleOnAllWorkspaces() {}
    setFullScreenable() {}
    loadURL() {
      return loaded
    }
  }
  const create = loadTypescript(
    fileURLToPath(new URL('./window.ts', import.meta.url)),
    {
      electron: { BrowserWindow: Window },
      'electron-postman': { ipcMain: { registerBrowserWindow() {} } },
      '@/electron/utils': { getTopLeftWindow: () => null, createProtocol() {} },
      '@/teams/speech-worker/modules/electron-speech-worker-window': {
        start: (value) => started.push(value),
      },
      '@/teams/speech-worker/electron/const': {
        windowHeight: 64,
        windowWidth: 64,
      },
    },
    {
      __dirname: 'fixture',
      __importMetaEnv: { VITE_ELECTRON_NODE_INTEGRATION: '0' },
    },
  ).default
  const pending = create('speech-worker')
  assert.deepEqual(started, [])
  resolveLoad()
  assert.equal(await pending, window)
  assert.deepEqual(started, [window])
  window.emit('ready-to-show')
  assert.equal(started.length, 1)
})
