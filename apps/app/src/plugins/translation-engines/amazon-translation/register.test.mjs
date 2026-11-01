import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

function engine({ values = {}, env = {} } = {}) {
  const requests = []
  return {
    requests,
    ...loadTypescript(
      fileURLToPath(new URL('./register.ts', import.meta.url)),
      {
        '@/modules/translation-engine-manager': {
          registerEngine: (_, engine) => engine,
        },
        './shared.ts': {
          ENGINE_ID: 'amazon-translate-translation',
          ENGINE_NAME: 'Amazon Translate',
          electronModuleName: 'AmazonTranslation',
        },
        './store.ts': { store: { getProperty: (key) => values[key] || '' } },
        './NvSettings.vue': {},
      },
      {
        __importMetaEnv: env,
        window: {
          AmazonTranslation: {
            async translate(request) {
              requests.push(request)
              return 'こんにちは。'
            },
          },
        },
      },
    ),
  }
}

const credentials = { identityPoolId: 'synthetic-pool', region: 'eu-west-1' }
test('Amazon Translate resolves Auto/Auto to the selected Azure voice locale', async () => {
  const state = engine({ values: credentials })
  assert.equal(await state.engine.translate('Hello.', 'ja-JP'), 'こんにちは。')
  assert.equal(state.requests[0].from, 'auto')
  assert.equal(state.requests[0].to, 'ja-JP')
  assert.equal(
    state.requests[0].credentials.identityPoolId,
    credentials.identityPoolId,
  )
})

test('the downloadable build requires saved Amazon Translate credentials', () => {
  assert.equal(engine().engine.hasCredentials(), false)
  assert.equal(engine({ values: credentials }).engine.hasCredentials(), true)
})

test('Infisical credentials enable translation without saved credentials', () => {
  assert.equal(
    engine({
      env: {
        VITE_TRANSLATION_ENGINE_AMAZON_TRANSLATION_IDENTITY_POOL_ID:
          credentials.identityPoolId,
        VITE_TRANSLATION_ENGINE_AMAZON_TRANSLATION_REGION: credentials.region,
      },
    }).engine.hasCredentials(),
    true,
  )
})

test('explicit translation settings override the voice language', async () => {
  const state = engine({
    values: { ...credentials, translateFrom: 'en', translateTo: 'fr' },
  })
  await state.engine.translate('Hello.', 'ja-JP')
  assert.equal(state.requests[0].from, 'en')
  assert.equal(state.requests[0].to, 'fr')
})
