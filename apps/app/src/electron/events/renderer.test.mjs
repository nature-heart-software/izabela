import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const require = createRequire(import.meta.url)
const source = (relative) => fileURLToPath(new URL(relative, import.meta.url))
test('renderer errors reach main when either optional overlay is absent', () => {
  const ipcRenderer = new EventEmitter()
  const sent = []
  ipcRenderer.send = (...args) => sent.push(args)
  const ipc = loadTypescript(
    source('../../../../../packages/electron-postman/src/ipcRenderer.js'),
    {
      electron: { ipcRenderer },
      './utils': require('../../../../../packages/electron-postman/src/utils.js'),
    },
  )
  ipcRenderer.emit(
    'init-renderer-ipc',
    {},
    'messenger',
    new Map([
      ['messenger', 1],
      ['speech-worker', 2],
    ]),
  )
  const events = loadTypescript(
    source('./renderer.ts'),
    {
      '@/types/electron': loadTypescript(source('../../types/electron.ts')),
    },
    { window: { ipc } },
  )
  const error = { name: 'Error', message: 'Original error' }
  assert.doesNotThrow(() => events.emitIPCProcessError(error))
  assert.deepEqual(sent, [['electron-postman-messenger-error', error]])
})
