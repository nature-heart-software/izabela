import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../load-typescript.cjs'
const root = new URL('../../apps/app/src/', import.meta.url)
const source = (path) => fileURLToPath(new URL(path, root))
const failure = Object.assign(Error('private provider response'), {
  status: 402,
})
const fail = async () => {
  throw failure
}

for (const team of ['messenger', 'overlay', 'speech-worker']) {
  test(`${team}: renderer startup reports uncaught async failures`, async () => {
    const errors = []
    const events = new EventTarget()
    let queryCache
    const app = {
      config: {},
      use(plugin, options) {
        if (options?.queryClientConfig)
          queryCache = options.queryClientConfig.queryCache
        plugin?.install?.(this)
        return this
      },
      mount() {},
      onUnmount() {},
    }
    const mocks = {
      vue: { createApp: () => app },
      'vue-query': { VueQueryPlugin: {} },
      '@/store': { pinia: {} },
      '@/store/stores.ts': { loadStores: () => new Promise(() => {}) },
      '@/teams/messenger/App.vue': {},
      '@/teams/speech-worker/App.vue': {},
      './App.vue': {},
      '@/teams/messenger/router': {},
      '@packages/ui': {},
      '@globalhive/vuejs-tour': {},
      '@/styles/tour.css': {},
      './styles': {},
      '@/features/session-errors/report': reporter(errors),
    }
    Object.defineProperty(mocks, '@/features/session-errors/plugin', {
      get: () =>
        loadTypescript(
          source('features/session-errors/plugin.ts'),
          { '@/features/session-errors/report': reporter(errors) },
          { window: events, console: { error() {} } },
        ),
    })
    loadTypescript(source(`teams/${team}/app.ts`), mocks, { window: events })
    app.config.errorHandler?.(failure)
    const event = new Event('unhandledrejection')
    Object.defineProperty(event, 'reason', { value: failure })
    events.dispatchEvent(event)
    queryCache?.config.onError(failure)
    assert.equal(
      errors.length,
      3,
      'final query failures must not disappear inside the query cache',
    )
  })
}
const reporter = (errors) => ({
  reportProviderError: (...args) => errors.push(args),
})

for (const provider of [
  'openai',
  'amazon-translation',
  'microsoft-azure',
  'google-translate',
  'google-cloud',
  'custom',
]) {
  test(`${provider}: rejected translation preserves source text and reports session error`, async () => {
    const errors = []
    let engine
    const { ENGINE_ID, ENGINE_NAME } = loadTypescript(
      source(`plugins/translation-engines/${provider}/shared.ts`),
    )
    loadTypescript(
      source(`plugins/translation-engines/${provider}/register.ts`),
      {
        '@/features/session-errors/report': reporter(errors),
        '@/modules/translation-engine-manager': {
          registerEngine(id, value) {
            engine = value
            return value
          },
        },
        './shared.ts': {
          ENGINE_ID,
          ENGINE_NAME,
          electronModuleName: 'Provider',
        },
        './store.ts': { store: { getProperty: () => 'fixture' } },
        axios: { post: fail },
      },
      {
        window: {
          Provider: { translate: fail },
          ElectronTranslation: { translate: fail },
        },
      },
    )
    assert.equal(await engine.translate('original text', 'fr'), 'original text')
    assert.equal(errors.length, 1)
    assert.equal(errors[0][0], failure)
    assert.equal(errors[0][1], 'translation')
    assert.equal(errors[0][2], ENGINE_ID)
  })
}

for (const provider of [
  'openai',
  'amazon-translation',
  'microsoft-azure',
  'google-translate',
  'google-cloud',
]) {
  test(`${provider}: main-process translation reports status before Electron can strip it`, async () => {
    const errors = []
    let translate
    const { ENGINE_ID } = loadTypescript(
      source(`plugins/translation-engines/${provider}/shared.ts`),
    )
    const mocks = {
      '@/features/session-errors/report': reporter(errors),
      '@packages/electron-bridger': {
        bridge: {
          register(entries) {
            translate = entries[0][1]().translate
          },
        },
      },
      './shared.ts': { ENGINE_ID, electronModuleName: 'Provider' },
      openai: class {
        chat = { completions: { create: fail } }
      },
      '@aws-sdk/client-translate': {
        TranslateClient: class {
          send = fail
        },
        TranslateTextCommand: class {},
      },
      '@aws-sdk/credential-providers': { fromCognitoIdentityPool: () => fail },
      '@azure-rest/ai-translation-text': {
        __esModule: true,
        default: () => ({ path: () => ({ post: fail }) }),
        isUnexpected: () => false,
      },
      '@vitalets/google-translate-api': { translate: fail },
      '@google-cloud/translate': {
        v2: {
          Translate: class {
            translate = fail
          },
        },
      },
    }
    const module = loadTypescript(
      source(
        provider === 'google-cloud'
          ? 'modules/electron-translation/index.ts'
          : `plugins/translation-engines/${provider}/bridge.ts`,
      ),
      mocks,
    )
    if (provider === 'google-cloud') translate = module.default.translate
    const result =
      provider === 'google-cloud'
        ? await translate('original text', { to: 'fr' })
        : await translate({
            text: 'original text',
            from: 'en',
            to: 'fr',
            credentials: {
              apiKey: 'fixture',
              region: 'fixture',
              identityPoolId: 'fixture',
            },
          })
    assert.equal(result, 'original text')
    assert.equal(errors.length, 1)
    assert.equal(errors[0][0], failure)
    assert.equal(errors[0][2], ENGINE_ID)
  })
}
