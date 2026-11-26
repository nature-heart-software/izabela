import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

test('custom recognition reports connection failures and disconnects silently on cleanup', () => {
  let endpoint,
    closed = 0
  const errors = []
  const socket = new EventEmitter()
  socket.disconnect = () => {
    closed++
  }
  const create = loadTypescript(
    fileURLToPath(new URL('./recognition.node.ts', import.meta.url)),
    {
      '@/features/settings/store': { useSettingsStore: () => ({}) },
      '@/features/session-errors/report': {
        reportProviderError: (...args) => errors.push(args),
      },
      'socket.io-client': (url) => {
        endpoint = url
        return socket
      },
      './register.node.ts': { hasCredentials: () => true },
    },
    { __importMetaEnv: { VITE_SERVER_WS_PORT: '8181' } },
  ).default
  const engine = create({})
  assert.equal(endpoint, 'ws://localhost:8181')
  socket.emit(
    'connect_error',
    Object.assign(Error('controlled disconnect'), { code: 'ECONNRESET' }),
  )
  assert.equal(errors.length, 1)
  assert.equal(errors[0][1], 'speech-recognition')
  assert.equal(
    errors[0][2],
    loadTypescript(fileURLToPath(new URL('./shared.ts', import.meta.url)))
      .ENGINE_ID,
  )
  engine.cleanup()
  socket.emit('connect_error', Error('late after cleanup'))
  assert.equal(errors.length, 1)
  assert.equal(closed, 1)
})
