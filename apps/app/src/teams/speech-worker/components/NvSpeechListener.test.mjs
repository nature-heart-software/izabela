import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as vue from 'vue'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

const filename = fileURLToPath(
  new URL('./NvSpeechListener.vue', import.meta.url),
)
const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
const { content } = compileScript(descriptor, {
  id: filename,
  inlineTemplate: true,
})
const flush = async () => {
  await vue.nextTick()
  await new Promise((resolve) => setImmediate(resolve))
  await vue.nextTick()
}
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const makeStream = () => {
  const track = {
    stops: 0,
    stop() {
      this.stops++
    },
  }
  return { track, getTracks: () => [track] }
}

function mount(t, { settings: overrides = {}, acquire, enumerate } = {}) {
  const settings = vue.reactive({
    enableSTTTS: true,
    speechRecognitionStrategy: 'continuous',
    soxDevice: 0,
    audioInputSensibility: -50,
    speechDetectionPolling: 40,
    ...overrides,
  })
  const recognition = vue.reactive({
    recording: false,
    $patch(patch) {
      Object.assign(this, patch)
    },
  })
  const requests = []
  const streams = []
  const detectors = []
  const errors = []
  const component = loadTypescript(
    filename,
    {
      vue,
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/features/speech/store': {
        useSpeechRecognitionStore: () => recognition,
      },
      '@/utils/media-devices': {
        getSoxMediaDeviceByIndex:
          enumerate || (async (index) => ({ deviceId: `mic-${index}` })),
      },
      hark(stream, options) {
        const detector = Object.assign(new EventEmitter(), {
          stream,
          options,
          stops: 0,
          resumes: 0,
          stop() {
            this.stops++
            this.emit('stopped_speaking')
          },
          async resume() {
            this.resumes++
          },
        })
        detectors.push(detector)
        return detector
      },
    },
    {
      navigator: {
        mediaDevices: {
          async getUserMedia(options) {
            requests.push(options)
            const stream = acquire ? await acquire(options) : makeStream()
            streams.push(stream)
            return stream
          },
        },
      },
      console: {
        log() {},
        error(...args) {
          errors.push(args)
        },
      },
    },
    content,
  ).default
  const renderer = vue.createRenderer({
    createComment: () => ({}),
    insert() {},
    remove() {},
    parentNode: () => null,
    nextSibling: () => null,
  })
  const app = renderer.createApp(component)
  app.mount({})
  t.after(() => app.unmount())
  return { app, settings, recognition, requests, streams, detectors, errors }
}

test('continuous detection starts on mount and drives the recording indicator', async (t) => {
  const state = mount(t)
  await flush()
  assert.equal(state.detectors.length, 1)
  assert.equal(state.requests[0].audio.deviceId.exact, 'mic-0')
  assert.equal(state.detectors[0].resumes, 1)
  state.detectors[0].emit('speaking')
  assert.equal(state.recognition.recording, true)
  state.detectors[0].emit('stopped_speaking')
  assert.equal(state.recognition.recording, false)
})

test('changing microphones releases the old stream and listens to the selected device', async (t) => {
  const state = mount(t)
  await flush()
  const old = state.detectors[0]
  old.emit('speaking')
  state.settings.soxDevice = 2
  await flush()
  assert.equal(state.requests[1].audio.deviceId.exact, 'mic-2')
  assert.equal(old.stops, 1)
  assert.equal(old.listenerCount('speaking'), 0)
  assert.equal(old.listenerCount('stopped_speaking'), 0)
  assert.equal(state.streams[0].track.stops, 1)
  assert.equal(state.recognition.recording, false)
  old.emit('speaking')
  assert.equal(state.recognition.recording, false)
  state.detectors[1].emit('speaking')
  assert.equal(state.recognition.recording, true)
})

test('disabled input and push-to-record do not acquire a browser microphone', async (t) => {
  for (const settings of [
    { enableSTTTS: false },
    { speechRecognitionStrategy: 'ptr' },
  ]) {
    const state = mount(t, { settings })
    await flush()
    assert.equal(state.requests.length, 0)
    assert.equal(state.detectors.length, 0)
    // Push-to-record owns this state in the main process.
    state.recognition.recording = true
    state.settings.audioInputSensibility = -30
    await flush()
    assert.equal(state.recognition.recording, true)
  }
})

test('disabling continuous detection stops capture and clears recording', async (t) => {
  const state = mount(t)
  await flush()
  state.detectors[0].emit('speaking')
  state.settings.enableSTTTS = false
  await flush()
  assert.equal(state.recognition.recording, false)
  assert.equal(state.streams[0].track.stops, 1)
  assert.equal(state.detectors[0].stops, 1)
  state.settings.enableSTTTS = true
  await flush()
  assert.equal(state.detectors.length, 2)
})

test('a late permission response is stopped and cannot replace the current microphone', async (t) => {
  const pending = deferred()
  const late = makeStream()
  const current = makeStream()
  const state = mount(t, {
    acquire: (options) =>
      options.audio.deviceId.exact === 'mic-0' ? pending.promise : current,
  })
  await flush()
  state.settings.soxDevice = 1
  await flush()
  assert.equal(state.detectors.length, 1)
  assert.equal(state.detectors[0].stream, current)
  state.detectors[0].emit('speaking')
  pending.resolve(late)
  await flush()
  assert.equal(late.track.stops, 1)
  assert.equal(current.track.stops, 0)
  assert.equal(state.recognition.recording, true)
  assert.equal(state.detectors.length, 1)
})

test('a cancelled enumeration never requests microphone access', async (t) => {
  const pending = deferred()
  const state = mount(t, { enumerate: () => pending.promise })
  state.settings.enableSTTTS = false
  await flush()
  pending.resolve({ deviceId: 'stale-device' })
  await flush()
  assert.equal(state.requests.length, 0)
})

test('microphone errors are handled and capture can be retried', async (t) => {
  let fail = true
  const state = mount(t, {
    acquire() {
      if (fail) throw new Error('Permission denied')
      return makeStream()
    },
  })
  await flush()
  assert.equal(state.errors.length, 1)
  assert.equal(state.recognition.recording, false)
  fail = false
  state.settings.soxDevice = 1
  await flush()
  assert.equal(state.detectors.length, 1)
})

test('sensitivity changes rebuild detection without retaining event handlers', async (t) => {
  const state = mount(t)
  await flush()
  state.settings.audioInputSensibility = -30
  state.settings.speechDetectionPolling = 100
  await flush()
  assert.equal(state.detectors[0].stops, 1)
  assert.equal(state.detectors[1].options.threshold, -30)
  assert.equal(state.detectors[1].options.interval, 100)
})

test('unmount releases both current and pending streams', async (t) => {
  const pending = deferred()
  const state = mount(t, {
    acquire: (options) =>
      options.audio.deviceId.exact === 'mic-0' ? makeStream() : pending.promise,
  })
  await flush()
  state.settings.soxDevice = 1
  await flush()
  state.app.unmount()
  const late = makeStream()
  pending.resolve(late)
  await flush()
  assert.equal(state.streams[0].track.stops, 1)
  assert.equal(late.track.stops, 1)
  assert.equal(state.detectors.length, 1)
  assert.equal(state.recognition.recording, false)
})
