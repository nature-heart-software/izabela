import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'
const flush = () => new Promise((r) => setTimeout(r, 15))
function fixture(options = {}) {
  const urls = new Set()
  const audios = [],
    events = []
  let supply
  const synthesis = new Promise((r) => {
    supply = r
  })
  const playing = {
    id: 'another-message',
    isPlaying: true,
    $patch(p) {
      Object.assign(this, p)
    },
  }
  class Audio extends EventEmitter {
    loads = 0
    addEventListener(...args) {
      this.on(...args)
    }
    load() {
      this.loads++
      this.emit('canplaythrough')
    }
    pause() {
      this.emit('pause')
    }
    removeAttribute(name) {
      delete this[name]
    }
    async setSinkId(id) {
      this.sinkId = id
      if (options.sinkError) throw Error('device unavailable')
    }
    play() {
      return this.failure ? Promise.reject(this.failure) : Promise.resolve()
    }
    constructor() {
      super()
      audios.push(this)
    }
  }
  const deferred = () => {
    let resolve, reject
    const promise = new Promise((a, b) => {
      resolve = a
      reject = b
    })
    return { promise, resolve, reject }
  }
  const create = loadTypescript(
    fileURLToPath(new URL('./IzabelaMessage.ts', import.meta.url)),
    {
      '@/modules/speech-engine-manager': {
        getEngineById: () => ({
          getUseCacheOnEveryRequest: () => false,
          synthesizeSpeech: () => synthesis,
        }),
      },
      '@/utils/media-devices': {
        getMediaDeviceByLabel: async (label) =>
          options.missing ? null : { deviceId: label },
      },
      '@/features/settings/store': {
        useSettingsStore: () => ({
          audioOutputs: options.outputs || [],
          playSpeechOnDefaultPlaybackDevice: options.defaultOutput !== false,
          $whenReady: async () => {},
        }),
      },
      '@/features/messages/store': { usePlayingMessageStore: () => playing },
      '@packages/toolbox': { Deferred: deferred, blobToBase64: async () => '' },
    },
    {
      Audio,
      document: { createElement: () => new Audio() },
      window: { ElectronFilesystem: { getCachedAudio: async () => null } },
      URL: {
        createObjectURL: () => {
          const url = 'blob:' + urls.size
          urls.add(url)
          return url
        },
        revokeObjectURL: (url) => urls.delete(url),
      },
      console: { error() {} },
    },
  ).default
  const message = create({
    id: 'test',
    engine: 'fixture',
    excludeFromHistory: true,
    payload: {},
  })
  message.on('ended', () => events.push('ended'))
  message.on('error', () => events.push('error'))
  return { message, audios, supply, events, playing, urls }
}

test('cancelled prefetch never loads late audio or clears another playing message', async () => {
  const f = fixture()
  f.message.cancel()
  f.message.cancel()
  f.supply(new Blob(['audio']))
  await flush()
  await f.message.isReady()
  assert.equal(f.audios[0].loads, 0)
  assert.equal(f.playing.id, 'another-message')
  assert.deepEqual(f.events, ['ended'])
})

test('actual audio playback rejection propagates to the queue', async () => {
  const f = fixture()
  f.supply(new Blob(['audio']))
  await flush()
  await f.message.isReady()
  f.audios[0].failure = Error('device removed')
  await assert.rejects(f.message.play(), /device removed/)
})

test('repeated media errors and a later ended event finish the message once', async () => {
  const f = fixture()
  f.supply(new Blob(['audio']))
  await flush()
  await f.message.isReady()
  f.audios[0].emit('error', Error('decode failed'))
  f.audios[0].emit('error', Error('duplicate'))
  f.audios[0].emit('ended')
  assert.deepEqual(f.events, ['error'])
})

test('selected outputs receive the audio, muted default stays muted, and every output finishes before completion', async () => {
  const f = fixture({ outputs: ['headset', 'cable'], defaultOutput: false })
  f.supply(new Blob(['audio']))
  await flush()
  await f.message.isReady()
  await f.message.play()
  assert.deepEqual(
    f.audios.slice(1).map((audio) => audio.sinkId),
    ['headset', 'cable'],
  )
  assert.equal(f.audios[0].volume, 0)
  f.audios[0].emit('ended')
  assert.deepEqual(f.events, [])
  f.audios[1].emit('ended')
  assert.deepEqual(f.events, [])
  f.audios[2].emit('ended')
  assert.deepEqual(f.events, ['ended'])
  assert.equal(f.urls.size, 0)
})
test('all unavailable selected outputs fail through the existing error path when default playback is disabled', async () => {
  for (const options of [{ missing: true }, { sinkError: true }]) {
    const f = fixture({
      outputs: ['headset'],
      defaultOutput: false,
      ...options,
    })
    f.supply(new Blob(['audio']))
    await assert.rejects(f.message.isReady(), /output|device/i)
    assert.deepEqual(f.events, ['error'])
  }
})
test('cancel and auxiliary playback errors release every object URL once', async () => {
  for (const failure of [false, true]) {
    const f = fixture({ outputs: ['headset'] })
    f.supply(new Blob(['audio']))
    await flush()
    await f.message.isReady()
    assert.equal(f.urls.size, 2)
    if (failure) f.audios[1].emit('error', Error('output disconnected'))
    else f.message.cancel()
    assert.equal(f.urls.size, 0)
    assert.deepEqual(f.events, [failure ? 'error' : 'ended'])
  }
})
test('500 completed messages do not retain blob URLs', async () => {
  for (let index = 0; index < 500; index++) {
    const f = fixture()
    f.supply(new Blob(['audio']))
    await f.message.isReady()
    await f.message.play()
    f.audios[0].emit('ended')
    assert.equal(f.urls.size, 0, 'URL leak at message ' + index)
  }
})
