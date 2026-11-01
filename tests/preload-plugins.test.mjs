import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from './load-typescript.cjs'

const source = (path) => fileURLToPath(new URL(path, import.meta.url))

for (const provider of [
  'amazon-translation',
  'microsoft-azure',
  'google-translate',
  'openai',
]) {
  test(`${provider}: preload exposes the same translation IPC without loading its SDK implementation`, async () => {
    const exposed = new Map()
    const requests = []
    const electron = {
      contextBridge: {
        exposeInMainWorld: (name, methods) => exposed.set(name, methods),
      },
      ipcRenderer: {
        invoke: async (...args) => {
          requests.push(args)
          return 'translated'
        },
      },
    }
    const bridge = loadTypescript(
      source('../packages/electron-bridger/src/main.ts'),
      { electron },
      { window: {} },
    ).bridge
    const directory = `../apps/app/src/plugins/translation-engines/${provider}/`
    const preloadMocks = { '@packages/electron-bridger': { bridge } }
    Object.defineProperty(preloadMocks, './bridge.ts', {
      get() {
        throw new Error(
          'Preload imported the main-only translation implementation',
        )
      },
    })
    loadTypescript(source(directory + 'register.preload.ts'), preloadMocks, {
      window: {},
    })
    assert.equal(exposed.size, 1)
    const [name, methods] = [...exposed][0]
    assert.deepEqual(Object.keys(methods), ['translate'])
    const payload = { text: 'hello', from: 'en', to: 'fr' }
    assert.equal(await methods.translate(payload), 'translated')
    assert.deepEqual(requests, [[`${name}-translate`, payload]])
    const registered = new Map()
    loadTypescript(source(directory + 'register.node.ts'), {
      '@packages/electron-bridger': {
        bridge: {
          register: (entries) =>
            entries.forEach(([key, factory]) => registered.set(key, factory())),
        },
      },
      '@aws-sdk/client-translate': {},
      '@aws-sdk/credential-providers': {},
      '@azure-rest/ai-translation-text': {},
      '@vitalets/google-translate-api': {},
      openai: {},
    })
    assert.deepEqual([...registered.keys()], [name])
    assert.deepEqual(Object.keys(registered.get(name)), Object.keys(methods))
  })
}
