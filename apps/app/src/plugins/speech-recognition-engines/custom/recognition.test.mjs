import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

test('custom recognition uses the configured socket port and disconnects on cleanup', () => {
  let endpoint,
    closed = 0
  const create = loadTypescript(
    fileURLToPath(new URL('./recognition.node.ts', import.meta.url)),
    {
      '@/features/settings/store': { useSettingsStore: () => ({}) },
      'socket.io-client': (url) => {
        endpoint = url
        return {
          disconnect() {
            closed++
          },
        }
      },
      './register.node.ts': { hasCredentials: () => true },
    },
    { __importMetaEnv: { VITE_SERVER_WS_PORT: '8181' } },
  ).default
  const engine = create({})
  assert.equal(endpoint, 'ws://localhost:8181')
  engine.cleanup()
  assert.equal(closed, 1)
})
