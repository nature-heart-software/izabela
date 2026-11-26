import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'
const flush = () => new Promise((r) => setTimeout(r, 15))
function fixture(options = {}) {
  const urls = new Set()
  const audios = [],
    events = []
  const reportedErrors = []
  let supply, fail
  const synthesis = new Promise((r, reject) => {
    supply = r
    fail = reject
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
      '@/features/session-errors/report': {
        reportProviderError: (...args) => reportedErrors.push(args),
      },
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
      window: {
        ElectronFilesystem: {
          getCachedAudio: async () => {
            if (options.cacheError)
              throw Object.assign(Error('cache unavailable'), {
                code: options.cacheError,
              })
            return null
          },
        },
      },
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
    disableAutoplay: options.disableAutoplay,
  })
  message.on('ended', () => events.push('ended'))
  message.on('error', () => events.push('error'))
  return {
    message,
    audios,
    supply,
    fail,
    reportedErrors,
    events,
    playing,
    urls,
  }
}

function historyDownloadFixture(f, options = {}) {
  const filename = fileURLToPath(
    new URL(
      '../../teams/messenger/components/NvHistoryMessage.vue',
      import.meta.url,
    ),
  )
  const script = readFileSync(filename, 'utf8').match(
    /<script[^>]*>([\s\S]*?)<\/script>/,
  )[1]
  const parsed = ts.createSourceFile(
    filename,
    script,
    ts.ScriptTarget.Latest,
    true,
  )
  const declaration = parsed.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((node) => node.name.getText(parsed) === 'downloadMessageLocally')
  assert.ok(declaration, 'real history download action must exist')
  const downloading = { value: false }
  const prompts = []
  let reader, signalReader
  const readerReady = new Promise((resolve) => {
    signalReader = resolve
  })
  const action = loadTypescript(
    filename,
    {},
    {
      downloading,
      message: {
        value: options.missing
          ? undefined
          : { engine: 'fixture', voice: 'voice', message: 'hello' },
      },
      engine: {
        value: {
          name: 'Fixture',
          getCredentials: () => ({}),
          getVoiceName: () => 'Voice',
        },
      },
      purify: (value) => value,
      IzabelaMessage: () => f.message,
      formatedCreatedAt: { value: 'date' },
      FileReader: class {
        constructor() {
          reader = this
          signalReader()
        }
        readAsDataURL() {
          if (!options.holdReader) this.onload()
        }
        result = 'data:audio/wav;base64,Zml4dHVyZQ=='
      },
      ElectronFilesystem: {
        downloadMessagePrompt: (...args) => {
          prompts.push(args)
          return options.prompt || Promise.resolve()
        },
      },
    },
    `export const action = ${declaration.initializer.getText(parsed)}`,
  ).action
  return {
    action,
    downloading,
    prompts,
    readerReady,
    get reader() {
      return reader
    },
  }
}

test('history download caller owns a failed synthesis and records it exactly once', () => {
  const url = import.meta.url
  const child = `
    import assert from 'node:assert/strict'
    import { EventEmitter } from 'node:events'
    import { fileURLToPath } from 'node:url'
    import { readFileSync } from 'node:fs'
    import ts from ${JSON.stringify(import.meta.resolve('typescript'))}
    import loadTypescript from ${JSON.stringify(
      new URL('../../../../../tests/load-typescript.cjs', url).href,
    )}
    const fixture = ${fixture
      .toString()
      .replaceAll('import.meta.url', JSON.stringify(url))}
    const historyDownloadFixture = ${historyDownloadFixture
      .toString()
      .replaceAll('import.meta.url', JSON.stringify(url))}
    const f = fixture({ disableAutoplay: true })
    const h = historyDownloadFixture(f)
    const listeners = new Map(), fallback = []
    const plugin = loadTypescript(${JSON.stringify(
      fileURLToPath(new URL('../../features/session-errors/plugin.ts', url)),
    )}, {
      '@/features/session-errors/report': { reportProviderError: (...args) => fallback.push(args) },
    }, { window: { addEventListener: (name, fn) => listeners.set(name, fn) } }).sessionErrorReporting
    plugin.install({ config: {}, onUnmount() {} })
    process.on('unhandledRejection', reason => listeners.get('unhandledrejection')({ reason }))
    const pending = h.action()
    f.fail(Object.assign(Error('private synthesis response'), { status: 402 }))
    await pending
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    console.log(JSON.stringify({ explicit: f.reportedErrors.length, fallback: fallback.length, operation: f.reportedErrors[0]?.[1], provider: f.reportedErrors[0]?.[2], downloading: h.downloading.value, prompts: h.prompts.length }))
  `
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', child],
    { encoding: 'utf8', timeout: 15000, env },
  )
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    explicit: 1,
    fallback: 0,
    operation: 'speech',
    provider: 'fixture',
    downloading: false,
    prompts: 0,
  })
})

for (const outcome of ['saved', 'cancelled', 'rejected']) {
  test(`history download ${outcome} prompt settles pending state without provider reports`, async () => {
    const f = fixture({ disableAutoplay: true })
    let settlePrompt
    const prompt = new Promise((resolve, reject) => {
      settlePrompt = () =>
        outcome === 'rejected'
          ? reject(Error('controlled prompt failure'))
          : resolve(outcome === 'cancelled' ? undefined : 'saved.wav')
    })
    const h = historyDownloadFixture(f, { prompt, holdReader: true })
    let finished = false
    const pending = h.action().then(() => {
      finished = true
    })
    f.supply(new Blob(['audio']))
    await h.readerReady
    assert.equal(h.downloading.value, true)
    assert.equal(finished, false)
    assert.equal(h.prompts.length, 0)
    h.reader.onload()
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(h.prompts.length, 1)
    assert.equal(h.prompts[0][0].disableAutoplay, true)
    assert.equal(h.prompts[0][0].excludeFromHistory, true)
    assert.equal(h.prompts[0][1], 'date - Fixture - Voice - hello')
    assert.equal(h.prompts[0][2], 'data:audio/wav;base64,Zml4dHVyZQ==')
    assert.equal(h.downloading.value, true)
    assert.equal(finished, false)
    settlePrompt()
    await pending
    assert.equal(h.downloading.value, false)
    assert.equal(finished, true)
    assert.equal(f.reportedErrors.length, 0)
  })
}

test('history download without a message releases pending state silently', async () => {
  const f = fixture({ disableAutoplay: true })
  const h = historyDownloadFixture(f, { missing: true })
  await h.action()
  assert.equal(h.downloading.value, false)
  assert.equal(h.prompts.length, 0)
  assert.equal(f.reportedErrors.length, 0)
})

test('an asynchronous synthesis rejection reaches session history once', async () => {
  const f = fixture()
  const error = Object.assign(Error('controlled provider failure'), {
    status: 402,
  })
  f.fail(error)
  await assert.rejects(f.message.isReady())
  assert.equal(f.reportedErrors.length, 1)
  assert.equal(f.reportedErrors[0][0], error)
  assert.equal(f.reportedErrors[0][1], 'speech')
  assert.equal(f.reportedErrors[0][2], 'fixture')
})

test('manual history downloads report failed synthesis without needing autoplay preparation', async () => {
  const f = fixture({ disableAutoplay: true })
  const pending = f.message.downloadAudioAndBlobify()
  f.fail(Object.assign(Error('controlled failed download'), { status: 402 }))
  await assert.rejects(pending)
  assert.equal(f.reportedErrors.length, 1)
})

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

for (const code of ['EACCES', 'ENOSPC', 'EPERM'])
  test(`unavailable cache (${code}) still synthesizes and completes playback`, async () => {
    const f = fixture({ cacheError: code })
    f.supply(new Blob(['audio']))
    await f.message.isReady()
    await f.message.play()
    f.audios[0].emit('ended')
    assert.deepEqual(f.events, ['ended'])
    assert.equal(f.urls.size, 0)
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

test('intentionally disabling all local outputs still permits muted playback', async () => {
  const f = fixture({ defaultOutput: false })
  f.supply(new Blob(['audio']))
  await f.message.isReady()
  await f.message.play()
  assert.equal(f.audios[0].volume, 0)
  f.audios[0].emit('ended')
  assert.deepEqual(f.events, ['ended'])
  assert.equal(f.urls.size, 0)
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
