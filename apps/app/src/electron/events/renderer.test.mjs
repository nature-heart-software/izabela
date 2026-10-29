import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const source = (path) => fileURLToPath(new URL(path, import.meta.url))

function fixture() {
  const nativeMain = new EventEmitter()
  const contents = new Map()
  const sends = []
  const errors = []
  let nextId = 0
  const utils = loadTypescript(
    source('../../../../../packages/electron-postman/src/utils.js'),
  )
  const postman = loadTypescript(
    source('../../../../../packages/electron-postman/src/ipcMain.js'),
    {
      electron: {
        ipcMain: nativeMain,
        webContents: { fromId: (id) => contents.get(id) },
      },
      './utils': utils,
    },
  )
  const types = loadTypescript(source('../../types/electron.ts'))
  const mainEvents = loadTypescript(source('./main.ts'), {
    '@/types/electron': types,
    'electron-postman': { ipcMain: postman },
  })
  mainEvents.onIPCProcessError((payload, process) => {
    errors.push({ payload, process })
  })

  function createRenderer(name) {
    const id = ++nextId
    const nativeRenderer = new EventEmitter()
    nativeRenderer.send = (channel, ...args) => {
      sends.push({ name, channel })
      const payload = structuredClone(args)
      queueMicrotask(() =>
        nativeMain.emit(channel, { sender: { id } }, ...payload),
      )
    }
    const ipc = loadTypescript(
      source('../../../../../packages/electron-postman/src/ipcRenderer.js'),
      { electron: { ipcRenderer: nativeRenderer }, './utils': utils },
    )
    const events = loadTypescript(
      source('./renderer.ts'),
      { '@/types/electron': types },
      { window: { ipc } },
    )
    const window = new EventEmitter()
    window.webContents = Object.assign(new EventEmitter(), {
      id,
      isDestroyed: () => !contents.has(id),
      send(channel, ...args) {
        const payload = structuredClone(args)
        queueMicrotask(() =>
          nativeRenderer.emit(channel, { senderId: 0 }, ...payload),
        )
      },
    })
    contents.set(id, window.webContents)
    postman.registerBrowserWindow(name, window)
    window.webContents.emit('did-finish-load')
    return {
      ...events,
      destroy() {
        window.emit('closed')
        contents.delete(id)
      },
    }
  }

  return {
    createRenderer,
    sends,
    errors,
    flush: () => new Promise(setImmediate),
  }
}

for (const process of ['messenger', 'speech-worker', 'overlay']) {
  test(`${process} reports errors once to main without an optional overlay`, async () => {
    const f = fixture()
    const renderers = new Map(
      ['messenger', 'speech-worker', 'overlay'].map((name) => [
        name,
        f.createRenderer(name),
      ]),
    )
    await f.flush()
    const payload = { name: 'Error', message: 'Provider failed' }
    assert.doesNotThrow(() =>
      renderers.get(process).emitIPCProcessError(payload),
    )
    await f.flush()
    assert.deepEqual(f.errors, [{ payload, process }])
    assert.deepEqual(f.sends, [
      { name: process, channel: `electron-postman-${process}-error` },
    ])
  })
}

test('renderer errors reach main when both optional overlays are absent', async () => {
  const f = fixture()
  const messenger = f.createRenderer('messenger')
  f.createRenderer('speech-worker')
  await f.flush()
  const payload = { name: 'Error', message: 'Original error' }
  assert.doesNotThrow(() => messenger.emitIPCProcessError(payload))
  await f.flush()
  assert.deepEqual(f.errors, [{ payload, process: 'messenger' }])
  assert.deepEqual(f.sends, [
    { name: 'messenger', channel: 'electron-postman-messenger-error' },
  ])
})

test('error reporting remains main-only across overlay creation and destruction', async () => {
  const f = fixture()
  const messenger = f.createRenderer('messenger')
  f.createRenderer('speech-worker')
  f.createRenderer('overlay')
  let overlay = f.createRenderer('messenger-game-overlay')
  await f.flush()
  const payload = { name: 'TypeError', message: 'Overlay operation failed' }
  assert.doesNotThrow(() => overlay.emitIPCProcessError(payload))
  await f.flush()
  overlay.destroy()
  await f.flush()
  assert.doesNotThrow(() => messenger.emitIPCProcessError(payload))
  await f.flush()
  overlay = f.createRenderer('messenger-game-overlay')
  await f.flush()
  assert.doesNotThrow(() => overlay.emitIPCProcessError(payload))
  await f.flush()
  assert.deepEqual(f.errors, [
    { payload, process: 'messenger-game-overlay' },
    { payload, process: 'messenger' },
    { payload, process: 'messenger-game-overlay' },
  ])
  assert.deepEqual(f.sends, [
    {
      name: 'messenger-game-overlay',
      channel: 'electron-postman-messenger-game-overlay-error',
    },
    { name: 'messenger', channel: 'electron-postman-messenger-error' },
    {
      name: 'messenger-game-overlay',
      channel: 'electron-postman-messenger-game-overlay-error',
    },
  ])
})
