import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'
const flush = () => new Promise((r) => setTimeout(r, 15))
function fixture() {
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
      '@/utils/media-devices': { getMediaDeviceByLabel() {} },
      '@/features/settings/store': {
        useSettingsStore: () => ({
          audioOutputs: [],
          playSpeechOnDefaultPlaybackDevice: true,
          $whenReady: async () => {},
        }),
      },
      '@/features/messages/store': { usePlayingMessageStore: () => playing },
      '@packages/toolbox': { Deferred: deferred, blobToBase64: async () => '' },
    },
    {
      Audio,
      window: { ElectronFilesystem: { getCachedAudio: async () => null } },
      URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
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
  return { message, audios, supply, events, playing }
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
