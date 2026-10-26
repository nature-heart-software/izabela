import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const providers = [
  'amazon-polly',
  'microsoft-azure',
  'google-cloud',
  'ibm-watson',
  'izabela',
]

function loadProvider(provider, services = {}, properties = {}) {
  return loadTypescript(
    fileURLToPath(
      new URL(
        `../../plugins/speech-engines/${provider}/register.ts`,
        import.meta.url,
      ),
    ),
    {
      '@/services': services,
      '@/modules/speech-engine-manager': { registerEngine: (engine) => engine },
      '@/features/speech/store': {
        useSpeechStore: () => ({ hasUniversalApiCredentials: true }),
      },
      '@/consts': { DEFAULT_LANGUAGE_CODE: 'en-US' },
      './NvVoiceSelect.vue': {},
      './NvSettings.vue': {},
      './shared': { ENGINE_ID: provider, ENGINE_NAME: provider },
      './store': { store: {}, getProperty: (key) => properties[key] },
    },
    {
      fetch: () => {
        throw new Error('Unexpected network request')
      },
    },
  ).engine
}

function registerPayloadEngine(properties, getRegions = async () => []) {
  const manager = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      '@/features/dictionary/store': {
        useDictionaryStore: () => ({
          translateText: (text) => `dictionary:${text}`,
        }),
      },
      '@/modules/engine-manager': loadTypescript(
        fileURLToPath(new URL('../engine-manager/index.ts', import.meta.url)),
      ),
    },
  )
  return manager.registerEngine({
    id: 'example',
    getRegions,
    store: { getProperty: (key) => properties[key] },
    getPayload: ({ text }) => ({ text }),
  })
}

test('registration adds the selected remote region to the client payload', () => {
  const engine = registerPayloadEngine({ remoteRegion: 'eu-west-2' })
  assert.deepEqual(
    JSON.parse(JSON.stringify(engine.getPayload({ text: 'hello' }))),
    {
      text: 'dictionary:hello',
      region: 'eu-west-2',
    },
  )
})

test('registration keeps region optional for defaults, Auto and local credentials', () => {
  for (const properties of [
    {},
    { remoteRegion: '' },
    { remoteRegion: 'auto' },
    { remoteRegion: 'eu-west-2', useLocalCredentials: true },
  ]) {
    const engine = registerPayloadEngine(properties)
    assert.equal(
      Object.hasOwn(engine.getPayload({ text: 'hello' }), 'region'),
      false,
    )
  }
})

test('registration does not add a region to engines without a catalog', () => {
  const engine = registerPayloadEngine({ remoteRegion: 'eu-west-2' }, null)
  assert.equal(
    Object.hasOwn(engine.getPayload({ text: 'hello' }), 'region'),
    false,
  )
})

for (const provider of providers) {
  test(`${provider}: sends the region separately without changing speech data or credentials`, async () => {
    for (const streamAudio of [false, true]) {
      const calls = []
      const engine = loadProvider(
        provider,
        {
          fetchApi: (...args) => calls.push(args),
        },
        { streamAudio, includeTimestamps: true },
      )
      const payload = { text: 'hello', region: 'test-region' }
      const credentials = { region: 'credential-region' }
      await engine.synthesizeSpeech({ credentials, payload })
      const [type, path, options, region] = calls[0]
      assert.equal(type, 'remote')
      assert.equal(
        path,
        `/tts/${provider}/synthesize-speech${streamAudio ? '/stream' : ''}`,
      )
      assert.equal(options.method, 'POST')
      assert.equal(region, 'test-region')
      const body = JSON.parse(options.body)
      assert.deepEqual(body.payload, { text: 'hello' })
      if (provider !== 'izabela')
        assert.deepEqual(body.credentials, credentials)
      if (
        ['amazon-polly', 'microsoft-azure', 'ibm-watson'].includes(provider)
      ) {
        assert.equal(body.includeTimestamps, true)
      }
      assert.deepEqual(payload, { text: 'hello', region: 'test-region' })
    }
  })

  test(`${provider}: registration fetches its optional remote region catalog`, async () => {
    const options = [
      { name: 'Auto', value: 'auto' },
      { name: 'Test region', value: 'test-region' },
    ]
    const requests = []
    const engine = loadProvider(provider, {
      api: (type) => ({
        async get(path) {
          requests.push({ type, path })
          return { data: options }
        },
      }),
    })
    assert.equal(typeof engine.getRegions, 'function')
    assert.equal(await engine.getRegions(), options)
    assert.deepEqual(requests, [
      { type: 'remote', path: `/tts/${provider}/list-regions` },
    ])
  })
}
