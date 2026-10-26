import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import axios from 'axios'
import loadTypescript from '../../../../tests/load-typescript.cjs'

function services(authenticated = true) {
  const settings = {
    universalApiEndpoint: 'https://membership.example.test',
    universalApiKey: 'member-one',
  }
  const calls = []
  const instance = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      axios,
      'socket.io-client': { io: () => ({}) },
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/features/speech/store': {
        useSpeechStore: () => ({ hasUniversalApiCredentials: authenticated }),
      },
      '@/utils/security': { decrypt: (value) => value },
    },
    {
      Headers,
      __importMetaEnv: { VITE_SERVER_PORT: '7070' },
      fetch: async (url, options) => {
        calls.push({ url: new URL(url), options })
        return new Response('audio')
      },
    },
  )
  for (const client of [instance.remoteAxiosApi, instance.localAxiosApi]) {
    client.defaults.adapter = async (config) => {
      calls.push({ url: new URL(axios.getUri(config)), options: config })
      return { data: [], status: 200, statusText: 'OK', headers: {}, config }
    }
  }
  return { ...instance, settings, calls }
}

test('fetch sends universal credentials only in the Bearer header', async () => {
  const { fetchApi, calls } = services()
  const body = JSON.stringify({
    credentials: { apiKey: 'provider-body-sentinel' },
    payload: { text: 'hello' },
  })
  await fetchApi('remote', '/tts/izabela/synthesize-speech/stream', {
    method: 'POST',
    body,
  })
  const request = calls[0]
  assert.equal(request.url.searchParams.has('apiKey'), false)
  assert.equal(
    new Headers(request.options.headers).get('authorization'),
    'Bearer member-one',
  )
  assert.equal(request.options.body, body)
})

test('Axios sends universal credentials in a header and preserves ordinary query parameters', async () => {
  const { api, calls } = services()
  await api('remote').get('/tts/izabela/list-voices', { params: { page: '2' } })
  assert.equal(calls[0].url.searchParams.has('apiKey'), false)
  assert.equal(calls[0].url.searchParams.get('page'), '2')
  assert.equal(
    calls[0].options.headers.get('Authorization'),
    'Bearer member-one',
  )
})

test('repeated Axios configuration uses the current credential and endpoint', async () => {
  const { api, settings, calls } = services()
  await api('remote').post('/tts/izabela/list-voices', {})
  settings.universalApiKey = 'member-two'
  settings.universalApiEndpoint = 'https://replacement.example.test'
  await api('remote').post('/tts/izabela/list-voices', {})
  assert.equal(calls[1].url.origin, 'https://replacement.example.test')
  assert.equal(calls[1].url.search, '')
  assert.equal(
    calls[1].options.headers.get('Authorization'),
    'Bearer member-two',
  )
})

test('local and unauthenticated-fallback requests do not receive universal credentials', async () => {
  for (const [type, authenticated] of [
    ['local', true],
    ['remote', false],
  ]) {
    const { api, fetchApi, calls } = services(authenticated)
    await fetchApi(type, '/tts/izabela/list-voices')
    await api(type).post('/tts/izabela/list-voices', {})
    for (const request of calls) {
      assert.equal(request.url.origin, 'http://localhost:7070')
      assert.equal(request.url.search, '')
      assert.equal(
        new Headers(request.options.headers).has('authorization'),
        false,
      )
    }
  }
})

test('fetch preserves custom headers provided in each HeadersInit form', async () => {
  for (const headers of [
    { 'X-Example': 'keep' },
    [['X-Example', 'keep']],
    new Headers({ 'X-Example': 'keep' }),
  ]) {
    const { fetchApi, calls } = services()
    await fetchApi('remote', '/tts/izabela/list-voices', { headers })
    const actual = new Headers(calls[0].options.headers)
    assert.equal(actual.get('X-Example'), 'keep')
    assert.equal(actual.get('Authorization'), 'Bearer member-one')
    assert.equal(actual.get('Content-Type'), 'application/json')
  }
})
