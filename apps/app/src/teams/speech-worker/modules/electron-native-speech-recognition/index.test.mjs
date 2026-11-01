import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import * as vue from 'vue'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'

for (const sampleRate of [undefined, 24000])
  test(`native capture configures ${
    sampleRate || 16000
  } Hz and delivers PCM to the recognition engine`, async () => {
    const scope = vue.effectScope()
    const recorderStream = new PassThrough()
    let recorderOptions
    let context
    let cleanup
    let stopped = 0
    let cleaned = 0
    const chunks = []
    const recognition = vue.reactive({ recording: false })
    const settings = {
      speechRecognitionStrategy: 'continuous',
      soxPreRecordingChunks: 1,
      soxPostRecordingChunks: 1,
      soxDevice: 2,
      selectedSpeechRecognitionEngine: 'fixture',
    }
    const start = loadTypescript(
      fileURLToPath(new URL('./index.ts', import.meta.url)),
      {
        vue,
        '@/features/settings/store': { useSettingsStore: () => settings },
        '@/features/speech/store': {
          useSpeechRecognitionStore: () => recognition,
        },
        'node-record-lpcm16': {
          record(options) {
            recorderOptions = options
            return {
              stream: () => recorderStream,
              stop() {
                stopped++
              },
            }
          },
        },
        '@/electron/utils.ts': { EXTERNALS_DIR: 'fixture-resources' },
        '@packages/toolbox': {
          Deferred() {
            let resolve
            const promise = new Promise((done) => {
              resolve = done
            })
            return { promise, resolve }
          },
        },
        'electron-postman': { ipcMain: { sendTo() {} } },
        '@/modules/speech-recognition-engine-manager': {
          getEngineById: () => ({
            sampleRateHertz: sampleRate,
            recognitionFn(value) {
              context = value
              return {
                startStream() {
                  context
                    .useRecording({ onChunk: (chunk) => chunks.push(chunk) })
                    .startPumping()
                },
                stopStream() {},
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
    try {
      scope.run(() => {
        cleanup = start()
      })
      assert.equal(recorderOptions.sampleRate, sampleRate || 16000)
      assert.equal(recorderOptions.recorder, 'sox')
      assert.equal(recorderOptions.audioType, 'raw')
      assert.equal(recorderOptions.device, 2)
      assert.equal(context.sampleRateHertz, recorderOptions.sampleRate)
      const before = Buffer.from([1, 2])
      const during = Buffer.from([3, 4])
      const after = Buffer.from([5, 6])
      recorderStream.write(before)
      recognition.recording = true
      await vue.nextTick()
      recorderStream.write(during)
      recognition.recording = false
      await vue.nextTick()
      recorderStream.write(after)
      recorderStream.write(Buffer.from([7, 8]))
      assert.deepEqual(
        Buffer.concat(chunks),
        Buffer.concat([before, during, after]),
      )
      cleanup()
      assert.equal(stopped, 1)
      assert.equal(cleaned, 1)
    } finally {
      scope.stop()
      recorderStream.destroy()
    }
  })
