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
  const main = load('./index.ts', mocks).default
  const report = load('./report.ts', {
    ...mocks,
    './index': { __esModule: true, default: main },
  }).reportProviderError
  return { main, report, store }
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

test('known engine identifiers have safe provider labels while arbitrary provider strings are discarded', async () => {
  const f = fixture()
  await f.report({ status: 402 }, 'speech', 'openai-tts')
  assert.equal(f.store.entries[0].provider, 'OpenAI')
  await f.report({ status: 403 }, 'translation', 'custom-translation')
  assert.equal(f.store.entries[1].provider, 'Custom')
  await f.report({}, 'provider', 'private credential value')
  assert.equal(f.store.entries[2].provider, undefined)
})

test('renderer reports carry only normalized metadata through the IPC boundary', async () => {
  const f = fixture()
  const sent = []
  const { reportProviderError } = load(
    './report.ts',
    { './index': { __esModule: true, default: f.main } },
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
  reportProviderError({ status: 403 }, 'speech', 'openai')
  assert.equal(f.store.entries[1].category, 'other')
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
