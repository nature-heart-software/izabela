import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../tests/load-typescript.cjs'

function loadServices(hasUniversalApiCredentials = true) {
  const calls = []
  const services = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      axios: { create: () => ({}) },
      'socket.io-client': { io: () => ({}) },
      '@/features/settings/store': {
        useSettingsStore: () => ({
          universalApiEndpoint: 'https://api.example.test',
          universalApiKey: 'encrypted-test-key',
        }),
      },
      '@/features/speech/store': {
        useSpeechStore: () => ({ hasUniversalApiCredentials }),
      },
      '@/utils/security': { decrypt: () => 'test-key' },
    },
    {
      __importMetaEnv: { VITE_SERVER_PORT: '7070' },
      fetch: async (url, options) => {
        calls.push({ url: new URL(url), options })
        return new Response('audio')
      },
    },
  )
  return { ...services, calls }
}

test('remote synthesis forwards an explicit region in the gateway query', async () => {
  const { fetchApi, calls } = loadServices()
  const body = JSON.stringify({ payload: { text: 'hello' } })
  await fetchApi(
    'remote',
    '/tts/amazon-polly/synthesize-speech/stream',
    {
      method: 'POST',
      body,
    },
    'eu-west-2',
  )
  assert.equal(calls[0].url.searchParams.get('region'), 'eu-west-2')
  assert.equal(calls[0].url.searchParams.get('apiKey'), 'test-key')
  assert.equal(calls[0].options.body, body)
})

test('omitted, empty and Auto regions preserve automatic remote routing', async () => {
  for (const region of [undefined, '', 'auto']) {
    const { fetchApi, calls } = loadServices()
    await fetchApi('remote', '/tts/izabela/synthesize-speech', {}, region)
    assert.equal(calls[0].url.searchParams.has('region'), false)
  }
})

test('local requests and the no-membership fallback never send a region override', async () => {
  for (const [type, authenticated] of [
    ['local', true],
    ['remote', false],
  ]) {
    const { fetchApi, calls } = loadServices(authenticated)
    await fetchApi(type, '/tts/amazon-polly/synthesize-speech', {}, 'eu-west-2')
    assert.equal(calls[0].url.origin, 'http://localhost:7070')
    assert.equal(calls[0].url.search, '')
  }
})
