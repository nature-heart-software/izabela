import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import * as vue from 'vue'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'

const flush = () => new Promise((resolve) => setImmediate(resolve))
function fixture({ held = false, fail = false } = {}) {
  const stream = new PassThrough(),
    sent = [],
    recordings = []
  const state = vue.reactive({ recording: held })
  let stopped = 0,
    cleaned = 0,
    context
  const start = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      vue,
      '@/features/settings/store': {
        useSettingsStore: () => ({
          speechRecognitionStrategy: 'ptr',
          selectedSpeechRecognitionEngine: 'fixture',
        }),
      },
      '@/features/speech/store': { useSpeechRecognitionStore: () => state },
      'node-record-lpcm16': {
        record: () => ({ stream: () => stream, stop: () => stopped++ }),
      },
      '@/electron/utils.ts': { EXTERNALS_DIR: '.' },
      '@packages/toolbox': {
        Deferred() {
          let resolve
          const promise = new Promise((r) => {
            resolve = r
          })
          return { promise, resolve }
        },
      },
      'electron-postman': { ipcMain: { sendTo: (...args) => sent.push(args) } },
      '@/modules/speech-recognition-engine-manager': {
        getEngineById: () => ({
          recognitionFn(c) {
            context = c
            return {
              async startStream() {
                if (fail) throw Error('offline')
                const chunks = []
                const recording = c.useRecording({
                  onChunk: (chunk) => chunks.push(chunk),
                })
                recordings.push({ ...recording, chunks })
                recording.startPumping()
              },
              cleanup() {
                cleaned++
              },
            }
          },
        }),
      },
    },
    { console: { log() {}, error() {} } },
  ).default
  const scope = vue.effectScope()
  const cleanup = scope.run(start)
  return {
    stream,
    sent,
    recordings,
    state,
    context: () => context,
    recover() {
      fail = false
    },
    cleanup,
    counts: () => [stopped, cleaned],
    close() {
      cleanup()
      scope.stop()
      stream.destroy()
    },
  }
}

test('restarting while the record shortcut is held resumes capture immediately', async () => {
  const f = fixture({ held: true })
  try {
    await flush()
    f.stream.write(Buffer.from([1, 2]))
    assert.equal(f.recordings.length, 1)
    assert.equal(f.recordings[0].chunks.length, 1)
  } finally {
    f.close()
  }
})

test('cleanup suppresses late transcripts, removes pumps and is idempotent', async () => {
  const f = fixture({ held: true })
  try {
    await flush()
    const recording = f.recordings[0]
    recording.startPumping()
    f.stream.write(Buffer.from([1, 2]))
    assert.equal(recording.chunks.length, 1)
    f.cleanup()
    f.cleanup()
    recording.resolve('late text')
    f.stream.write(Buffer.from([3, 4]))
    await flush()
    assert.equal(recording.chunks.length, 1)
    assert.equal(f.sent.length, 0)
    assert.deepEqual(f.counts(), [1, 1])
  } finally {
    f.close()
  }
})

test('out of order provider results retain speech order and cleanup releases pending waiters', async () => {
  const f = fixture({ held: true })
  try {
    await flush()
    f.state.recording = false
    await vue.nextTick()
    f.state.recording = true
    await flush()
    f.recordings[1].resolve('second')
    await flush()
    assert.equal(f.sent.length, 0)
    f.recordings[0].resolve('first')
    await flush()
    assert.deepEqual(
      f.sent.map((args) => args[2]),
      ['first', 'second'],
    )
  } finally {
    f.close()
  }
})

test('an asynchronous provider startup failure stays handled and a later recording can start', async () => {
  const f = fixture({ held: true, fail: true })
  try {
    await flush()
    f.state.recording = false
    await vue.nextTick()
    f.recover()
    f.state.recording = true
    await flush()
    assert.equal(f.sent.length, 0)
    assert.equal(f.recordings.length, 1)
  } finally {
    f.close()
  }
})

test('completed turns immediately detach PCM pumps during a long capture session', async () => {
  const f = fixture()
  try {
    for (let index = 0; index < 500; index++) {
      const recording = f.context().useRecording({ onChunk() {} })
      recording.startPumping()
      recording.resolve('')
      assert.equal(f.stream.listenerCount('data'), 1)
    }
    await flush()
    assert.deepEqual(f.sent, [])
  } finally {
    f.close()
  }
})
