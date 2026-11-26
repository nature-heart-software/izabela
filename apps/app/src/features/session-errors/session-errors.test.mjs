import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const { createPinia, setActivePinia } = createRequire(import.meta.url)('pinia')
import loadTypescript from '../../../../../tests/load-typescript.cjs'
const source = (name) => fileURLToPath(new URL(name, import.meta.url))
const load = (name, mocks = {}, globals = {}) =>
  loadTypescript(source(name), mocks, globals)

function fixture() {
  setActivePinia(createPinia())
  const { useSessionErrorsStore } = load('./store.ts')
  const store = useSessionErrorsStore()
  const mocks = {
    '@/features/session-errors/store': { useSessionErrorsStore: () => store },
  }
  const mainModule = load('./index.ts', mocks)
  const main = mainModule.default
  const report = load('./report.ts', {
    ...mocks,
    './index': { __esModule: true, ...mainModule },
  }).reportProviderError
  return { main, mainModule, report, store }
}

test('classifies structured provider failures without exposing raw data or treating arbitrary forbidden responses as subscriptions', async () => {
  const cases = [
    [{ code: 'ENOTFOUND' }, 'connection'],
    [{ name: 'TypeError', message: 'Failed to fetch' }, 'connection'],
    [{ response: { status: 402 } }, 'subscription'],
    [{ status: 403 }, 'other'],
    [{ status: 401 }, 'other'],
    [{ error: { code: 'insufficient_quota' } }, 'subscription'],
    [{ code: 14 }, 'connection'],
    [{ cause: { code: 'ETIMEDOUT' } }, 'connection'],
    [{ status: 429 }, 'other'],
    [null, 'other'],
    ['arbitrary provider rejection', 'other'],
  ]
  for (const [error, category] of cases) {
    const f = fixture()
    await f.report(error, 'translation', 'custom')
    assert.equal(f.store.entries[0].category, category, JSON.stringify(error))
  }
})

test('intentional cancellation does not create session errors', async () => {
  const f = fixture()
  for (const error of [
    { name: 'AbortError' },
    { code: 'ERR_CANCELED' },
    { name: 'CanceledError' },
  ])
    await f.report(error, 'speech', 'openai')
  assert.equal(f.store.entries.length, 0)
})

test('main retains bounded opaque engine IDs without requiring renderer plugin registrations', async () => {
  const f = fixture()
  for (const id of [
    'future-plugin-v7',
    'acme.voice.v2',
    '@acme/voice-v2',
    'acme:voice:v2',
    '声のプラグイン v2',
    'x'.repeat(128),
  ]) {
    await f.report({ status: 402 }, 'speech', id)
    assert.equal(f.store.entries.at(-1).provider, id)
  }
  for (const id of ['x'.repeat(129), '', null, { secret: 'credential' }]) {
    f.main.report({ category: 'other', operation: 'provider', provider: id })
    assert.equal(f.store.entries.at(-1).provider, undefined)
  }
})

test('renderer reports carry only normalized metadata through the IPC boundary', async () => {
  const f = fixture()
  const sent = []
  const { reportProviderError } = load(
    './report.ts',
    { './index': { __esModule: true, ...f.mainModule } },
    {
      window: {
        ElectronSessionErrors: {
          report(value) {
            sent.push(JSON.parse(JSON.stringify(value)))
            f.main.report(sent.at(-1))
          },
        },
      },
    },
  )
  reportProviderError(
    Object.assign(Error('private request body and credential'), {
      status: 402,
      config: { headers: { Authorization: 'private credential' } },
    }),
    'speech',
    'openai',
  )
  assert.equal(f.store.entries[0].category, 'subscription')
  assert.doesNotMatch(
    JSON.stringify(sent),
    /private|request body|Authorization/,
  )
  reportProviderError({ status: 403 }, 'speech', 'openai-tts')
  assert.equal(f.store.entries[1].category, 'other')
  assert.equal(sent[1].provider, 'openai-tts')
  for (const id of ['x'.repeat(129), '', null, { secret: 'credential' }]) {
    reportProviderError({}, 'speech', id)
    assert.equal(sent.at(-1).provider, undefined)
  }
})

test('registered opaque plugin IDs survive reporting IPC and main history into operation-owned names', () => {
  const f = fixture()
  const managerMocks = {
    '@/modules/engine-manager': load('../../modules/engine-manager/index.ts'),
    '@/features/dictionary/store': {
      useDictionaryStore: () => ({ translateText: (text) => text }),
    },
  }
  const managers = Object.fromEntries(
    ['speech', 'speech-recognition', 'translation'].map((operation) => [
      operation,
      load(`../../modules/${operation}-engine-manager/index.ts`, managerMocks)
        .default,
    ]),
  )
  const { getProviderName } = load(
    './provider-name.ts',
    Object.fromEntries(
      Object.entries(managers).map(([operation, manager]) => [
        `@/modules/${operation}-engine-manager`,
        { __esModule: true, default: manager },
      ]),
    ),
  )
  const sent = []
  const { reportProviderError } = load(
    './report.ts',
    { './index': { __esModule: true, ...f.mainModule } },
    {
      window: {
        ElectronSessionErrors: {
          report(value) {
            const payload = JSON.parse(JSON.stringify(value))
            sent.push(payload)
            f.main.report(payload)
          },
        },
      },
    },
  )
  const error = Object.assign(Error('PRIVATE_ERROR_MESSAGE'), {
    status: 402,
    headers: { Authorization: 'PRIVATE_HEADER' },
    config: { data: 'PRIVATE_REQUEST_BODY' },
  })
  for (const id of [
    'future-plugin-v7',
    'acme.voice.v2',
    '@acme/voice-v2',
    'acme:voice:v2',
    '声のプラグイン v2',
    'x'.repeat(128),
  ]) {
    for (const [operation, manager] of Object.entries(managers)) {
      const engine = { id, name: `Registered ${operation} Plugin` }
      if (operation === 'speech') manager.registerEngine(engine)
      else manager.registerEngine(id, engine)
      assert.equal(getProviderName({ provider: id, operation }), engine.name)
      reportProviderError(error, operation, id)
      assert.equal(sent.at(-1).provider, id)
      const entry = f.main.read().entries.at(-1)
      assert.equal(entry.provider, id)
      assert.equal(entry.category, 'subscription')
      assert.equal(getProviderName(entry), engine.name)
    }
  }
  for (const provider of [
    'unregistered-plugin',
    'https://private.example/token',
    'private credential',
  ]) {
    for (const operation of Object.keys(managers)) {
      reportProviderError(error, operation, provider)
      assert.equal(getProviderName(f.main.read().entries.at(-1)), undefined)
    }
  }
  assert.doesNotMatch(
    JSON.stringify({ sent, state: f.main.read() }),
    /PRIVATE_ERROR_MESSAGE|PRIVATE_HEADER|PRIVATE_REQUEST_BODY|Authorization|headers|config/,
  )
})

test('a reported provider failure becomes safe session history and clear retains session occurrence', async () => {
  const f = fixture()
  await f.report(
    Object.assign(Error('private request text and token'), {
      code: 'ECONNRESET',
    }),
    'speech',
    'openai',
  )
  const state = await f.main.read()
  assert.equal(state.entries.length, 1)
  assert.equal(state.entries[0].category, 'connection')
  assert.equal(state.entries[0].operation, 'speech')
  assert.equal(state.hasOccurred, true)
  assert.doesNotMatch(JSON.stringify(state), /private|request text|token/)
  await f.main.clear()
  assert.equal(f.store.entries.length, 0)
  assert.equal(f.store.hasOccurred, true)
  setActivePinia(createPinia())
  assert.equal(load('./store.ts').useSessionErrorsStore().hasOccurred, false)
})
