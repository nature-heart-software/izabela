import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../load-typescript.cjs'

const base = new URL('../../apps/app/src/', import.meta.url)
test('OpenAI waits for its session, sends GA transcription config, and commits client-defined turns', async (t) => {
  const sockets = []
  class WebSocket extends EventEmitter {
    static OPEN = 1
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
  await recognizer.startStream()
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
})

function azure(t) {
  let handlers, callback, recognizer
  const stream = {
    closes: 0,
    close() {
      this.closes++
    },
    write() {},
  }
  const sdk = {
    SpeechConfig: { fromSubscription: () => ({ close() {} }) },
    AudioInputStream: { createPushStream: () => stream },
    AudioConfig: { fromStreamInput: () => ({}) },
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
      '@/features/settings/store': {
        useSettingsStore: () => ({ speechInputLanguage: 'en-US' }),
      },
      './register.node.ts': {
        hasCredentials: () => true,
        getCredentials: () => ({ apiKey: 'synthetic-key', region: 'westus' }),
      },
    },
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
