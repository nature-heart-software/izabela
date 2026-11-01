import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

function translationBridge({ response, error, sdk } = {}) {
  const requests = []
  const clients = []
  let translate
  loadTypescript(fileURLToPath(new URL('./bridge.ts', import.meta.url)), {
    '@packages/electron-bridger': {
      bridge: {
        register(entries) {
          translate = entries[0][1]().translate
        },
      },
    },
    './shared.ts': { electronModuleName: 'azure-translation' },
    '@azure-rest/ai-translation-text': sdk || {
      __esModule: true,
      default(endpoint, credentials) {
        clients.push({ endpoint, credentials })
        return {
          path(route) {
            assert.equal(route, '/translate')
            return {
              async post(options) {
                requests.push(JSON.parse(JSON.stringify(options)))
                if (error) throw error
                return (
                  response || {
                    status: '200',
                    body: {
                      value: [{ translations: [{ text: 'Bonjour' }] }],
                    },
                  }
                )
              },
            }
          },
        }
      },
      isUnexpected(result) {
        return result.status !== '200'
      },
    },
  })
  return { translate, requests, clients }
}

const input = {
  text: 'Hello',
  from: 'en',
  to: 'fr',
  credentials: { apiKey: 'synthetic-key', region: 'westeurope' },
}

test('Azure translation uses the current SDK request and response contract', async () => {
  const bridge = translationBridge()
  assert.equal(await bridge.translate(input), 'Bonjour')
  assert.deepEqual(bridge.requests, [
    {
      body: {
        inputs: [
          {
            text: 'Hello',
            language: 'en',
            targets: [{ language: 'fr' }],
          },
        ],
      },
    },
  ])
  assert.equal(bridge.clients.length, 1)
  assert.equal(bridge.clients[0].credentials.key, 'synthetic-key')
  assert.equal(bridge.clients[0].credentials.region, 'westeurope')
})

test('Azure translation leaves the source language unset for automatic detection', async () => {
  const bridge = translationBridge()
  assert.equal(await bridge.translate({ ...input, from: undefined }), 'Bonjour')
  assert.equal(
    Object.hasOwn(bridge.requests[0].body.inputs[0], 'language'),
    false,
  )
})

test('Azure service errors preserve the original text', async () => {
  const bridge = translationBridge({
    response: { status: '401', body: { error: { message: 'Denied' } } },
  })
  assert.equal(await bridge.translate(input), input.text)
  assert.equal(bridge.requests.length, 1)
})

test('Azure transport errors preserve the original text', async () => {
  const bridge = translationBridge({ error: new Error('Connection failed') })
  assert.equal(await bridge.translate(input), input.text)
  assert.equal(bridge.requests.length, 1)
})

test('Azure translation serializes and parses through the installed SDK without networking', async () => {
  const require = createRequire(import.meta.url)
  const sdk = require('@azure-rest/ai-translation-text')
  const sdkRequire = createRequire(
    require.resolve('@azure-rest/ai-translation-text'),
  )
  const { createHttpHeaders } = sdkRequire('@azure/core-rest-pipeline')
  const requests = []
  const bridge = translationBridge({
    sdk: {
      __esModule: true,
      ...sdk,
      default(endpoint, credentials) {
        return sdk.default(endpoint, credentials, {
          httpClient: {
            async sendRequest(request) {
              requests.push(request)
              return {
                request,
                status: 200,
                headers: createHttpHeaders({
                  'content-type': 'application/json',
                }),
                bodyAsText: JSON.stringify({
                  value: [
                    { translations: [{ text: 'Bonjour', language: 'fr' }] },
                  ],
                }),
              }
            },
          },
        })
      },
    },
  })
  assert.equal(await bridge.translate(input), 'Bonjour')
  assert.equal(requests.length, 1)
  assert.equal(new URL(requests[0].url).pathname, '/translate')
  assert.deepEqual(JSON.parse(requests[0].body), {
    inputs: [{ text: 'Hello', language: 'en', targets: [{ language: 'fr' }] }],
  })
})
