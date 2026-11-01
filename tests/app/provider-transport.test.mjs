import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../load-typescript.cjs'
const appRoot = new URL('../../apps/app/src/', import.meta.url)
function registration(kind, provider, mocks, globals = {}) {
  const filename = fileURLToPath(
    new URL(`plugins/${kind}/${provider}/register.ts`, appRoot),
  )
  const source = readFileSync(filename, 'utf8')
  for (const [, dependency] of source.matchAll(/from ['"]([^'"]+\.vue)['"]/g))
    mocks[dependency] = {}
  const getProperty = (name) =>
    ({
      apiKey: 'fixture',
      region: 'fixture',
      identityPoolId: 'fixture',
      selectedVoice: { name: 'fixture', languageCodes: ['fr-FR'] },
    }[name] ?? false)
  const store = { getProperty }
  mocks['./store'] = mocks['./store.ts'] = { store, getProperty }
  return loadTypescript(filename, mocks, globals).engine
}
for (const provider of [
  'amazon-polly',
  'google-cloud',
  'microsoft-azure',
  'ibm-watson',
  'elevenlabs',
  'openai',
])
  for (const fault of [401, 413, 429, 503, 'disconnect', 'truncated'])
    test(`TTS ${provider}: ${fault} rejects and the next HTTP request succeeds`, async (t) => {
      let failure = fault
      const requests = []
      const server = createServer(async (req, res) => {
        for await (const chunk of req) {
        }
        requests.push(req.url)
        if (failure === 'disconnect') {
          req.socket.destroy()
          return
        }
        if (failure === 'truncated') {
          res.writeHead(200, {
            'content-type': 'audio/mpeg',
            'content-length': 9999,
          })
          res.write('short')
          res.socket.destroy()
          return
        }
        res.writeHead(typeof failure === 'number' ? failure : 200, {
          'content-type': 'audio/mpeg',
        })
        res.end(Buffer.from([1, 2, 3, 4]))
      })
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
      t.after(async () => {
        if (server.listening) {
          server.closeAllConnections()
          await new Promise((resolve) => server.close(resolve))
        }
      })
      const port = server.address().port
      const settings = {},
        speech = { hasUniversalApiCredentials: false, customCommands: [] }
      const services = loadTypescript(
        fileURLToPath(new URL('services/index.ts', appRoot)),
        {
          axios: { create: () => ({}) },
          'socket.io-client': { io: () => ({}) },
          '@/features/settings/store': { useSettingsStore: () => settings },
          '@/features/speech/store': { useSpeechStore: () => speech },
          '@/utils/security': { decrypt: (value) => value },
        },
        { fetch, Headers, __importMetaEnv: { VITE_SERVER_PORT: port } },
      )
      const engine = registration('speech-engines', provider, {
        '@/services': services,
        '@/modules/speech-engine-manager': {
          registerEngine: (options) => options,
        },
        '@/features/speech/store': { useSpeechStore: () => speech },
        '@/consts': { DEFAULT_LANGUAGE_CODE: 'en-US' },
        '@/consts.ts': { DEFAULT_LANGUAGE_CODE: 'en-US' },
        '@/utils/text': { capitalize: (text) => text },
      })
      const request = async () => {
        const response = await engine.synthesizeSpeech({
          credentials: {},
          payload: { text: 'fixture', voice: {} },
        })
        return Buffer.from(await response.arrayBuffer())
      }
      try {
        await assert.rejects(request())
        failure = null
        assert.deepEqual(await request(), Buffer.from([1, 2, 3, 4]))
        assert.equal(requests.length, 2)
        assert.ok(requests.every((url) => url.includes('/synthesize-speech')))
      } finally {
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
      }
    })
for (const provider of [
  'amazon-translation',
  'microsoft-azure',
  'openai',
  'google-cloud',
  'google-translate',
])
  for (const code of [401, 429, 'ETIMEDOUT', 'ECONNRESET'])
    test(`translation ${provider}: ${code} preserves existing fallback and can recover`, async () => {
      let failure = true
      const calls = []
      const bridge = {
        async translate(...args) {
          calls.push(args)
          if (failure)
            throw Object.assign(Error('controlled failure'), { code })
          return 'Bonjour le monde.'
        },
      }
      const window = new Proxy({}, { get: () => bridge })
      const engine = registration(
        'translation-engines',
        provider,
        {
          '@/modules/translation-engine-manager': {
            registerEngine: (...args) => args.at(-1),
          },
        },
        { window },
      )
      assert.equal(
        await engine.translate('Hello world.', 'fr-FR'),
        'Hello world.',
      )
      failure = false
      assert.equal(
        await engine.translate('Hello world.', 'fr-FR'),
        'Bonjour le monde.',
      )
      assert.equal(calls.length, 2)
    })

for (const provider of [
  'amazon-polly',
  'google-cloud',
  'microsoft-azure',
  'ibm-watson',
  'elevenlabs',
  'openai',
])
  test(`TTS ${provider}: Unicode, multiline and large text reach transport without truncation`, async () => {
    const calls = [],
      speech = { customCommands: [] }
    const engine = registration('speech-engines', provider, {
      '@/services': {
        fetchApi: async (...args) => {
          calls.push(JSON.parse(args[2].body))
          return new Response('audio')
        },
      },
      '@/modules/speech-engine-manager': { registerEngine: (value) => value },
      '@/features/speech/store': { useSpeechStore: () => speech },
      '@/consts': { DEFAULT_LANGUAGE_CODE: 'en-US' },
      '@/consts.ts': { DEFAULT_LANGUAGE_CODE: 'en-US' },
      '@/utils/text': { capitalize: (text) => text },
    })
    const voice = {
      name: 'fixture',
      Id: 'fixture',
      SupportedEngines: ['neural'],
      languageCodes: ['fr-FR'],
      ShortName: 'fixture',
      Locale: 'fr-FR',
    }
    for (const text of [
      'Ça va ?\nこんにちは\nمرحبًا 👩🏽‍💻 & < > "',
      'é'.repeat(6000),
    ]) {
      const payload = engine.getPayload({ text, voice })
      assert.equal(
        payload.text ?? payload.Text ?? payload.input?.text ?? payload.input,
        text,
      )
      await engine.synthesizeSpeech({ credentials: {}, payload })
      const sent = calls.at(-1).payload
      assert.equal(
        sent.text ?? sent.Text ?? sent.input?.text ?? sent.input,
        text,
      )
    }
  })

test('Azure expressive SSML escapes text and translation while preserving plain text', () => {
  const engine = registration('speech-engines', 'microsoft-azure', {
    '@/services': {},
    '@/modules/speech-engine-manager': { registerEngine: (value) => value },
    '@/features/speech/store': {},
  })
  const voice = { ShortName: 'fr-FR-DeniseNeural', StyleList: ['cheerful'] }
  for (const translatedText of [undefined, '日本語 & <翻訳> "مرحبًا"']) {
    const payload = engine.getPayload({
      text: '/cheerful Ça va & <hello> "yes"?',
      translatedText,
      voice,
    })
    assert.ok(payload.ssml.includes('&amp;'))
    assert.ok(payload.ssml.includes('&lt;'))
    assert.ok(
      !payload.ssml.includes('<hello>') && !payload.ssml.includes('<翻訳>'),
    )
    assert.equal(payload.text, translatedText || ' Ça va & <hello> "yes"?')
  }
})

for (const provider of [
  'amazon-translation',
  'microsoft-azure',
  'openai',
  'google-cloud',
  'google-translate',
])
  test(`translation ${provider}: Unicode and multiline input/output are preserved`, async () => {
    const text = 'Ça va ?\nこんにちは 👩🏽‍💻',
      translated = 'مرحبًا بالعالم\n日本語 & < >'
    const inputs = []
    const bridge = {
      async translate(...args) {
        inputs.push(args)
        return translated
      },
    }
    const engine = registration(
      'translation-engines',
      provider,
      {
        '@/modules/translation-engine-manager': {
          registerEngine: (...args) => args.at(-1),
        },
      },
      { window: new Proxy({}, { get: () => bridge }) },
    )
    assert.equal(await engine.translate(text, 'ar-SA'), translated)
    assert.ok(JSON.stringify(inputs).includes('Ça va'))
  })
