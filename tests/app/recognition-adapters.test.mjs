import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../load-typescript.cjs'
import azureSdk from 'microsoft-cognitiveservices-speech-sdk'

const base = new URL('../../apps/app/src/', import.meta.url)
test('OpenAI waits for its session, sends GA transcription config, and commits client-defined turns', async (t) => {
  const sockets = []
  class WebSocket extends EventEmitter {
    static OPEN = 1
    static CONNECTING = 0
    constructor(url, options) {
      super()
      this.url = url
      this.options = options
      this.readyState = 0
      this.sent = []
      sockets.push(this)
      setImmediate(() => {
        this.readyState = 1
        this.emit('open')
      })
    }
    send(value) {
      this.sent.push(JSON.parse(value))
    }
    close() {
      this.readyState = 3
      this.emit('close')
    }
  }
  const globals = {
    console,
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
  }
  const manager = loadTypescript(
    fileURLToPath(
      new URL(
        'teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts',
        base,
      ),
    ),
    { ws: { WebSocket } },
    globals,
  )
  const create = loadTypescript(
    fileURLToPath(
      new URL(
        'plugins/speech-recognition-engines/openai/recognition.node.ts',
        base,
      ),
    ),
    {
      ws: { WebSocket },
      '@/features/session-errors/report': { reportProviderError() {} },
      '@/features/settings/store': {
        useSettingsStore: () => ({ speechInputLanguage: 'en-US' }),
      },
      '@/teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts':
        manager,
      './store.ts': {
        store: {
          getProperty: (key) => (key === 'model' ? 'gpt-4o-transcribe' : ''),
        },
      },
      './register.node.ts': {
        hasCredentials: () => true,
        getCredentials: () => ({ apiKey: 'synthetic-key' }),
      },
    },
    globals,
  ).default
  let recording
  const transcripts = []
  const recognizer = create({
    useRecording(handlers) {
      recording = handlers
      return {
        startPumping() {
          handlers.onChunk(Buffer.from([1, 2, 3, 4]))
        },
        stopPumping() {},
        resolve: (text) => transcripts.push(text),
      }
    },
  })
  t.after(() => recognizer.cleanup())
  const starting = recognizer.startStream()
  // A short utterance may be released before the reconnect finishes.
  recording.onEnded()
  await starting
  const socket = sockets[0]
  const config = socket.sent[0]
  assert.equal(config.type, 'session.update')
  assert.equal(config.session.type, 'transcription')
  assert.equal(config.session.audio.input.format.rate, 24000)
  assert.equal(
    config.session.audio.input.transcription.model,
    'gpt-4o-transcribe',
  )
  assert.equal(config.session.audio.input.turn_detection, null)
  assert.equal(socket.options.headers['OpenAI-Beta'], undefined)
  assert.equal(socket.sent[1].type, 'input_audio_buffer.append')
  recording.onEnded()
  assert.equal(socket.sent[2].type, 'input_audio_buffer.commit')
  socket.emit(
    'message',
    Buffer.from(
      JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'Known fixture speech',
      }),
    ),
  )
  assert.deepEqual(transcripts, ['Known fixture speech'])
  recording.onEnded()
  assert.equal(
    socket.sent.filter((event) => event.type === 'input_audio_buffer.commit')
      .length,
    1,
  )
  socket.close()
  await recognizer.startStream()
  assert.equal(
    sockets.length,
    2,
    'Closed sessions must reconnect for the next turn',
  )
  const replacement = sockets[1]
  replacement.emit(
    'message',
    Buffer.from(
      JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: '',
      }),
    ),
  )
  assert.deepEqual(
    transcripts,
    ['Known fixture speech', ''],
    'Empty final results must release the recording',
  )
  replacement.emit('message', Buffer.from('{bad frame'))
})

function openaiTransport(t, closeCode = 1005) {
  const sockets = [],
    reports = [],
    transcripts = []
  const timers = []
  class WebSocket extends EventEmitter {
    static OPEN = 1
    static CONNECTING = 0
    readyState = 1
    constructor() {
      super()
      sockets.push(this)
    }
    send() {}
    close(code = closeCode) {
      this.readyState = 3
      this.emit('close', code)
    }
  }
  const globals = {
    setTimeout,
    clearTimeout,
    clearInterval,
    setInterval(callback) {
      timers.push(callback)
      return setInterval(() => {}, 60000)
    },
    console: { error() {} },
  }
  const manager = loadTypescript(
    fileURLToPath(
      new URL(
        'teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts',
        base,
      ),
    ),
    { ws: { WebSocket } },
    globals,
  )
  const { classifyProviderError } = loadTypescript(
    fileURLToPath(new URL('features/session-errors/report.ts', base)),
    { './index': {} },
  )
  const create = loadTypescript(
    fileURLToPath(
      new URL(
        'plugins/speech-recognition-engines/openai/recognition.node.ts',
        base,
      ),
    ),
    {
      ws: { WebSocket },
      '@/features/session-errors/report': {
        reportProviderError: (error, operation, provider) =>
          reports.push({
            error,
            operation,
            provider,
            category: classifyProviderError(error),
          }),
      },
      '@/features/settings/store': {
        useSettingsStore: () => ({ speechInputLanguage: 'en-US' }),
      },
      '@/teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts':
        manager,
      './store.ts': { store: { getProperty: () => '' } },
      './register.node.ts': {
        hasCredentials: () => true,
        getCredentials: () => ({ apiKey: 'fixture' }),
      },
    },
    globals,
  ).default
  const engine = create({
    useRecording: () => ({
      startPumping() {},
      stopPumping() {},
      resolve: (text) => transcripts.push(text),
    }),
  })
  t.after(() => engine.cleanup())
  return { engine, sockets, reports, transcripts, replace: () => timers[0]() }
}

test('OpenAI established socket errors report one connection failure and allow the next turn', async (t) => {
  const f = openaiTransport(t)
  await f.engine.startStream()
  f.sockets[0].emit(
    'error',
    Object.assign(Error('private transport detail'), { code: 'ECONNRESET' }),
  )
  f.sockets[0].close(1006)
  assert.equal(f.reports.length, 1)
  assert.equal(f.reports[0].category, 'connection')
  assert.equal(f.reports[0].operation, 'speech-recognition')
  assert.equal(f.reports[0].provider, 'openai')
  assert.deepEqual(f.transcripts, [''])
  await f.engine.startStream()
  f.sockets[1].emit(
    'message',
    Buffer.from(
      JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'recovered',
      }),
    ),
  )
  assert.deepEqual(f.transcripts, ['', 'recovered'])
  assert.equal(f.reports.length, 1)
})

test('OpenAI abnormal close without an error reports one connection failure', async (t) => {
  const f = openaiTransport(t)
  await f.engine.startStream()
  f.sockets[0].close(1006)
  f.sockets[0].emit('error', Error('late transport error'))
  f.sockets[0].close(1006)
  assert.equal(f.reports.length, 1)
  assert.equal(f.reports[0].category, 'connection')
  assert.deepEqual(f.transcripts, [''])
})

for (const mode of [
  'normal-close',
  'empty-close',
  'cleanup',
  'replacement',
  'completed',
]) {
  test(`OpenAI ${mode} stays silent`, async (t) => {
    const f = openaiTransport(t)
    await f.engine.startStream()
    if (mode === 'normal-close') f.sockets[0].close(1000)
    if (mode === 'empty-close') f.sockets[0].close(1005)
    if (mode === 'cleanup') f.engine.cleanup()
    if (mode === 'replacement') {
      f.replace()
      await new Promise((resolve) => setImmediate(resolve))
      assert.equal(f.sockets.length, 2)
      assert.equal(f.sockets[0].readyState, 3)
    }
    if (mode === 'completed') {
      f.sockets[0].emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'conversation.item.input_audio_transcription.completed',
            transcript: 'complete',
          }),
        ),
      )
      f.sockets[0].close(1006)
    }
    f.sockets[0].emit('error', Error('late error after teardown'))
    assert.equal(f.reports.length, 0)
    assert.deepEqual(f.transcripts, [mode === 'completed' ? 'complete' : ''])
  })
}

test('OpenAI intentional replacement stays silent even when its close handshake fails', async (t) => {
  const f = openaiTransport(t, 1006)
  await f.engine.startStream()
  f.replace()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(f.sockets.length, 2)
  f.sockets[0].emit('error', Error('late close handshake error'))
  assert.equal(f.reports.length, 0)
  assert.deepEqual(f.transcripts, [''])
})

function azure(t, reportProviderError = () => {}) {
  let handlers, callback, recognizer
  const stream = {
    closes: 0,
    close() {
      this.closes++
    },
    write() {},
  }
  const sdk = {
    CancellationReason: azureSdk.CancellationReason,
    CancellationErrorCode: azureSdk.CancellationErrorCode,
    SpeechConfig: { fromSubscription: () => ({ close() {} }) },
    AudioInputStream: { createPushStream: () => stream },
    AudioConfig: { fromStreamInput: () => ({ close() {} }) },
    ResultReason: { RecognizedSpeech: 1, NoMatch: 2, Canceled: 3 },
    SpeechRecognizer: class {
      constructor() {
        recognizer = this
        this.closes = 0
      }
      recognizeOnceAsync(value) {
        callback = value
      }
      close() {
        if (++this.closes > 1) throw new Error('already disposed')
      }
    },
  }
  const create = loadTypescript(
    fileURLToPath(
      new URL(
        'plugins/speech-recognition-engines/microsoft-azure/recognition.node.ts',
        base,
      ),
    ),
    {
      'microsoft-cognitiveservices-speech-sdk': sdk,
      '@/features/session-errors/report': { reportProviderError },
      '@/features/settings/store': {
        useSettingsStore: () => ({ speechInputLanguage: 'en-US' }),
      },
      './register.node.ts': {
        hasCredentials: () => true,
        getCredentials: () => ({ apiKey: 'synthetic-key', region: 'westus' }),
      },
    },
    { setTimeout, clearTimeout },
  ).default
  const transcripts = []
  const engine = create({
    useRecording(value) {
      handlers = value
      return {
        startPumping() {},
        stopPumping() {},
        resolve: (text) => transcripts.push(text),
      }
    },
  })
  t.after(() => engine.cleanup())
  engine.startStream()
  return {
    stream,
    recognizer,
    transcripts,
    end: () => handlers.onEnded(),
    result: () => callback({ reason: 1, text: 'Known fixture speech' }),
  }
}
for (const name of ['ConnectionFailure', 'ServiceTimeout']) {
  test(`Azure ${name} cancellation retains connection classification once`, (t) => {
    const { classifyProviderError } = loadTypescript(
      fileURLToPath(new URL('features/session-errors/report.ts', base)),
      { './index': {} },
    )
    const reports = []
    const f = azure(t, (...args) => reports.push(args))
    const event = {
      reason: azureSdk.CancellationReason.Error,
      errorCode: azureSdk.CancellationErrorCode[name],
      errorDetails: 'private SDK response',
    }
    f.recognizer.canceled(null, event)
    f.recognizer.canceled(null, event)
    assert.equal(reports.length, 1)
    assert.equal(classifyProviderError(reports[0][0]), 'connection')
    assert.equal(reports[0][1], 'speech-recognition')
    assert.equal(reports[0][2], 'microsoft-azure')
    assert.deepEqual(Object.keys(reports[0][0]), ['code'])
    assert.equal(
      classifyProviderError({ code: event.errorCode }),
      'other',
      'SDK numeric codes must not acquire global meanings',
    )
    assert.deepEqual(f.transcripts, [''])
  })
}

test('Azure normal EndOfStream cancellation stays silent', (t) => {
  const reports = []
  const f = azure(t, (...args) => reports.push(args))
  f.recognizer.canceled(null, {
    reason: azureSdk.CancellationReason.EndOfStream,
    errorCode: azureSdk.CancellationErrorCode.NoError,
  })
  assert.equal(reports.length, 0)
  assert.deepEqual(f.transcripts, [''])
})

test('Azure final results are not disposed again when trailing PCM finishes', (t) => {
  const state = azure(t)
  state.result()
  state.end()
  assert.equal(state.recognizer.closes, 1)
  assert.deepEqual(state.transcripts, ['Known fixture speech'])
})
test('Azure input closure still permits its final recognition result', (t) => {
  const state = azure(t)
  state.end()
  assert.equal(state.stream.closes, 1)
  assert.equal(state.recognizer.closes, 0)
  state.result()
  assert.equal(state.recognizer.closes, 1)
})
