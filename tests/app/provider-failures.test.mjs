import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import loadTypescript from '../load-typescript.cjs'
const root = new URL('../../apps/app/src/', import.meta.url)
const flush = () => new Promise((resolve) => setImmediate(resolve))
function fixture(provider) {
  const streams = [],
    turns = [],
    clients = [],
    timers = new Map(),
    logs = [],
    uploads = []
  const directory = mkdtempSync(path.join(os.tmpdir(), 'izabela-provider-'))
  let timerId = 0,
    credentialFailure = false,
    modelFailure = false,
    uploadFailure = null,
    result
  const globals = {
    Buffer,
    AbortController,
    console: { log() {}, error: (...args) => logs.push(args) },
    setTimeout: (fn) => {
      const id = ++timerId
      timers.set(id, fn)
      return id
    },
    clearTimeout: (id) => timers.delete(id),
    setInterval: () => ++timerId,
    clearInterval() {},
  }
  class Stream extends EventEmitter {
    writes = []
    ends = 0
    destroys = 0
    write(chunk) {
      this.writes.push(Buffer.from(chunk))
    }
    end() {
      this.ends++
    }
    destroy() {
      this.destroys++
      this.destroyed = true
    }
  }
  const newStream = () => {
    const stream = new Stream()
    streams.push(stream)
    return stream
  }
  class WebSocket extends EventEmitter {
    static OPEN = 1
    static CONNECTING = 0
    readyState = 1
    sent = []
    constructor() {
      super()
      clients.push(this)
    }
    send(value) {
      this.sent.push(JSON.parse(value))
    }
    close() {
      if (this.readyState === 3) return
      this.readyState = 3
      this.closed = true
      this.emit('close')
    }
  }
  const credentials = {
    hasCredentials: () => true,
    getCredentials: () => ({
      apiKey: 'fixture',
      region: 'westus',
      identityPoolId: 'pool',
      url: 'https://fixture.invalid',
    }),
  }
  const mocks = {
    '@/features/settings/store': {
      useSettingsStore: () => ({ speechInputLanguage: 'en-US' }),
    },
    './register.node.ts': credentials,
    './store.ts': { store: { getProperty: () => false } },
    '@google-cloud/speech': {
      v1p1beta1: {
        SpeechClient: class {
          constructor() {
            clients.push(this)
          }
          streamingRecognize() {
            return newStream()
          }
          close() {
            this.closed = true
            return Promise.resolve()
          }
        },
      },
    },
    'ibm-watson/auth': { IamAuthenticator: class {} },
    'ibm-watson/speech-to-text/v1': class {
      constructor() {
        clients.push(this)
      }
      async listModels() {
        if (modelFailure) throw Error('catalog unavailable')
        return { result: { models: [] } }
      }
      recognizeUsingWebSocket() {
        return newStream()
      }
    },
    'microsoft-cognitiveservices-speech-sdk': {
      SpeechConfig: { fromSubscription: () => ({ close() {} }) },
      AudioInputStream: { createPushStream: newStream },
      AudioConfig: { fromStreamInput: () => ({ close() {} }) },
      ResultReason: { RecognizedSpeech: 1, NoMatch: 2, Canceled: 3 },
      SpeechRecognizer: class {
        constructor() {
          clients.push(this)
        }
        recognizeOnceAsync(success, failure) {
          this.success = success
          this.failure = failure
        }
        close() {
          this.closed = true
        }
      },
    },
    '@aws-sdk/credential-providers': {
      fromCognitoIdentityPool: () => async () => {
        if (credentialFailure) throw Error('unauthorized credentials')
        return { accessKeyId: 'fixture', secretAccessKey: 'fixture' }
      },
    },
    '@aws-sdk/client-transcribe-streaming': {
      StartStreamTranscriptionCommand: class {
        constructor(input) {
          this.input = input
        }
      },
      TranscribeStreamingClient: class {
        constructor() {
          clients.push(this)
        }
        send(command) {
          this.command = command
          return new Promise((resolve, reject) => {
            this.succeed = resolve
            this.fail = reject
          })
        }
        destroy() {
          this.closed = true
          this.fail?.(Error('closed'))
        }
      },
    },
    '@elevenlabs/elevenlabs-js': {
      ElevenLabsClient: class {
        speechToText = {
          convert: async (input, options) => {
            uploads.push({ input, options })
            if (uploadFailure) throw uploadFailure
            return await new Promise((resolve, reject) => {
              result = { resolve, reject }
            })
          },
        }
      },
    },
    electron: { app: { getPath: () => directory } },
    '@root/package.json': { productName: 'fixture' },
    ws: { WebSocket },
  }
  mocks[
    '@/teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts'
  ] = loadTypescript(
    fileURLToPath(
      new URL(
        'teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts',
        root,
      ),
    ),
    { ws: { WebSocket } },
    globals,
  )
  const create = loadTypescript(
    fileURLToPath(
      new URL(
        `plugins/speech-recognition-engines/${provider}/recognition.node.ts`,
        root,
      ),
    ),
    mocks,
    globals,
  ).default
  const context = {
    sampleRateHertz: 16000,
    useRecording(handlers) {
      const turn = {
        handlers,
        results: [],
        pumping: false,
        resolve: (text) => turn.results.push(text),
        startPumping() {
          turn.pumping = true
          handlers.onChunk(Buffer.from([1, 2, 3, 4]))
        },
        stopPumping() {
          turn.pumping = false
        },
      }
      turns.push(turn)
      return turn
    },
  }
  let engine
  const f = {
    streams,
    turns,
    clients,
    timers,
    logs,
    uploads,
    globals,
    create() {
      engine = create(context)
      return engine
    },
    start() {
      const pending = engine.startStream()
      Promise.resolve(pending).catch(() => {})
      return pending
    },
    async begin() {
      this.start()
      await flush()
      return turns.at(-1)
    },
    end() {
      turns.at(-1).handlers.onEnded()
    },
    fail(error) {
      if (provider === 'openai')
        clients.at(-1).emit(
          'message',
          Buffer.from(
            JSON.stringify({
              type: 'error',
              error: { message: error.message },
            }),
          ),
        )
      else if (provider === 'microsoft-azure') clients.at(-1).failure?.(error)
      else if (provider === 'amazon-transcribe') clients.at(-1).fail(error)
      else if (provider === 'elevenlabs') result.reject(error)
      else streams.at(-1).emit('error', error)
    },
    success(text = 'recovered speech') {
      if (provider === 'openai')
        clients.at(-1).emit(
          'message',
          Buffer.from(
            JSON.stringify({
              type: 'conversation.item.input_audio_transcription.completed',
              transcript: text,
            }),
          ),
        )
      else if (provider === 'microsoft-azure')
        clients.at(-1).success({ reason: 1, text })
      else if (provider === 'amazon-transcribe')
        clients.at(-1).succeed({
          TranscriptResultStream: (async function* () {
            yield {
              TranscriptEvent: {
                Transcript: {
                  Results: [
                    {
                      IsPartial: false,
                      Alternatives: [{ Items: [{ Content: text }] }],
                    },
                  ],
                },
              },
            }
          })(),
        })
      else if (provider === 'elevenlabs') result.resolve({ text })
      else
        streams.at(-1).emit('data', {
          results: [
            {
              isFinal: true,
              final: true,
              alternatives: [{ transcript: text }],
            },
          ],
        })
    },
    expire() {
      for (const [id, fn] of [...timers]) {
        timers.delete(id)
        fn()
      }
    },
    setCredentialFailure(value) {
      credentialFailure = value
    },
    setModelFailure(value) {
      modelFailure = value
    },
    cleanup() {
      engine?.cleanup()
      engine?.cleanup()
    },
    async dispose() {
      engine?.cleanup()
      await Promise.all(
        uploads.map(({ input }) =>
          input.file.closed
            ? null
            : new Promise((resolve) => input.file.once('close', resolve)),
        ),
      )
      await flush()
      rmSync(directory, { recursive: true, force: true })
    },
  }
  return f
}
const providers = [
  'google-cloud',
  'ibm-watson',
  'microsoft-azure',
  'amazon-transcribe',
  'elevenlabs',
  'openai',
]
for (const provider of providers) {
  for (const code of [401, 429, 'ECONNRESET'])
    test(`${provider}: ${code} releases the turn and the next request works`, async () => {
      const f = fixture(provider)
      f.create()
      try {
        await f.begin()
        if (provider === 'elevenlabs') {
          f.end()
          await flush()
        }
        f.fail(Object.assign(Error('controlled provider failure'), { code }))
        await flush()
        assert.deepEqual(f.turns[0].results, [''])
        await f.begin()
        if (provider === 'elevenlabs') {
          f.end()
          await flush()
        }
        f.success()
        await flush()
        assert.deepEqual(f.turns[1].results, ['recovered speech'])
      } finally {
        await f.dispose()
      }
    })
  test(`${provider}: cleanup closes active work and ignores a late result`, async () => {
    const f = fixture(provider)
    f.create()
    try {
      await f.begin()
      if (provider === 'elevenlabs') {
        f.end()
        await flush()
      }
      f.cleanup()
      assert.deepEqual(f.turns[0].results, [''])
      assert.equal(f.turns[0].pumping, false)
      if (provider !== 'elevenlabs') f.success('late result')
      else f.success('late result')
      await flush()
      assert.deepEqual(f.turns[0].results, [''])
      if (['google-cloud', 'ibm-watson'].includes(provider))
        assert.equal(f.streams[0].destroyed, true)
      if (provider === 'microsoft-azure' || provider === 'amazon-transcribe')
        assert.equal(f.clients.at(-1).closed, true)
      if (provider === 'openai') assert.equal(f.clients.at(-1).closed, true)
      if (provider === 'elevenlabs')
        assert.equal(f.uploads[0].options.abortSignal.aborted, true)
    } finally {
      await f.dispose()
    }
  })
  test(`${provider}: a silent server after input ends times out and allows the next turn`, async () => {
    const f = fixture(provider)
    f.create()
    try {
      await f.begin()
      f.end()
      await flush()
      f.expire()
      await flush()
      assert.deepEqual(f.turns[0].results, [''])
      await f.begin()
      if (provider === 'elevenlabs') {
        f.end()
        await flush()
      }
      f.success()
      await flush()
      assert.deepEqual(f.turns[1].results, ['recovered speech'])
    } finally {
      await f.dispose()
    }
  })
  test(`${provider}: empty final text resolves once`, async () => {
    const f = fixture(provider)
    f.create()
    try {
      await f.begin()
      if (provider === 'elevenlabs') {
        f.end()
        await flush()
      }
      f.success('')
      await flush()
      assert.deepEqual(f.turns[0].results, [''])
    } finally {
      await f.dispose()
    }
  })
}

test('Amazon credential acquisition failure is handled and a later turn retries', async () => {
  const f = fixture('amazon-transcribe')
  f.setCredentialFailure(true)
  f.create()
  try {
    await flush()
    await f.begin()
    await flush()
    assert.deepEqual(f.turns[0].results, [''])
    f.setCredentialFailure(false)
    await f.begin()
    f.success()
    await flush()
    assert.deepEqual(f.turns[1].results, ['recovered speech'])
  } finally {
    await f.dispose()
  }
})
test('Amazon preserves the first PCM chunk while credentials are acquired', async () => {
  const f = fixture('amazon-transcribe')
  f.create()
  try {
    await f.begin()
    f.end()
    const bytes = []
    for await (const event of f.clients[0].command.input.AudioStream)
      bytes.push(Buffer.from(event.AudioEvent.AudioChunk))
    assert.deepEqual(Buffer.concat(bytes), Buffer.from([1, 2, 3, 4]))
    f.success()
    await flush()
  } finally {
    await f.dispose()
  }
})
test('IBM model catalog failure does not escape as an unhandled rejection', async () => {
  const f = fixture('ibm-watson')
  f.setModelFailure(true)
  f.create()
  try {
    await flush()
    await f.begin()
    f.success()
    await flush()
    assert.deepEqual(f.turns[0].results, ['recovered speech'])
  } finally {
    await f.dispose()
  }
})
for (const provider of providers)
  test(`${provider}: 200 turns leave no live turn timers or accumulated listeners`, async () => {
    const f = fixture(provider)
    f.create()
    try {
      for (let index = 0; index < 200; index++) {
        await f.begin()
        f.end()
        await flush()
        if (index % 7 === 0) f.fail(Error('controlled intermittent failure'))
        else f.success()
        await flush()
        assert.equal(f.turns[index].results.length, 1)
        assert.equal(f.turns[index].pumping, false)
        if (provider === 'openai')
          assert.equal(f.clients.at(-1).listenerCount('message'), 0)
      }
      f.cleanup()
      await flush()
      assert.equal(f.timers.size, 0)
      if (['google-cloud', 'ibm-watson'].includes(provider))
        assert.ok(f.streams.every((stream) => stream.destroyed))
      if (['microsoft-azure', 'amazon-transcribe', 'openai'].includes(provider))
        assert.ok(f.clients.every((client) => client.closed))
      if (provider === 'elevenlabs')
        assert.ok(
          f.uploads.every((upload) => upload.options.abortSignal.aborted),
        )
    } finally {
      await f.dispose()
    }
  })

test('OpenAI keeps rapid consecutive turns separate while the previous transcript is pending', async () => {
  const f = fixture('openai')
  f.create()
  try {
    await f.begin()
    f.end()
    await f.begin()
    f.end()
    f.success('first turn')
    await flush()
    assert.deepEqual(f.turns[0].results, ['first turn'])
    assert.deepEqual(
      f.turns[1].results,
      [],
      'Second turn consumed the first transcript',
    )
    f.success('second turn')
    await flush()
    assert.deepEqual(f.turns[1].results, ['second turn'])
  } finally {
    await f.dispose()
  }
})
