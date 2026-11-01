import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

const require = createRequire(import.meta.url)
const sdk = require('@aws-sdk/client-translate')
const credentials = {
  accessKeyId: 'synthetic-id',
  secretAccessKey: 'synthetic-secret',
  sessionToken: 'synthetic-token',
}

function bridge({
  statusCode = 200,
  body = { TranslatedText: 'こんにちは。' },
  credentialError,
} = {}) {
  let translate
  const requests = []
  const pools = []
  const errors = []
  const clients = []
  let destroyed = 0
  loadTypescript(
    fileURLToPath(new URL('./bridge.ts', import.meta.url)),
    {
      '@packages/electron-bridger': {
        bridge: {
          register(entries) {
            translate = entries[0][1]().translate
          },
        },
      },
      './shared.ts': { electronModuleName: 'amazon-translation' },
      '@aws-sdk/credential-providers': {
        fromCognitoIdentityPool(options) {
          pools.push(options)
          return async () => {
            if (credentialError) throw credentialError
            return credentials
          }
        },
      },
      '@aws-sdk/client-translate': {
        ...sdk,
        TranslateClient: class extends sdk.TranslateClient {
          constructor(config) {
            super({
              ...config,
              maxAttempts: 1,
              requestHandler: {
                async handle(request) {
                  requests.push(request)
                  return {
                    response: {
                      statusCode,
                      headers: { 'content-type': 'application/x-amz-json-1.1' },
                      body: Readable.from([JSON.stringify(body)]),
                    },
                  }
                },
              },
            })
            clients.push(this)
          }
          destroy() {
            destroyed++
            super.destroy()
          }
        },
      },
    },
    {
      console: {
        error(...args) {
          errors.push(args)
        },
      },
    },
  )
  return {
    translate,
    requests,
    pools,
    errors,
    clients,
    get destroyed() {
      return destroyed
    },
  }
}

const input = {
  text: 'Hello.',
  from: 'auto',
  to: 'ja-JP',
  credentials: {
    identityPoolId: 'eu-west-1:synthetic-pool',
    region: 'eu-west-1',
  },
}

test('Amazon Translate Auto/Auto with Azure Nanami uses auto → ja-JP through the installed SDK', async () => {
  const state = bridge()
  assert.equal(await state.translate(input), 'こんにちは。')
  assert.equal(state.requests.length, 1)
  assert.deepEqual(JSON.parse(state.requests[0].body), {
    Text: 'Hello.',
    SourceLanguageCode: 'auto',
    TargetLanguageCode: 'ja-JP',
  })
  assert.equal(state.requests[0].hostname, 'translate.eu-west-1.amazonaws.com')
  assert.equal(
    state.requests[0].headers['x-amz-target'],
    'AWSShineFrontendService_20170701.TranslateText',
  )
  assert.equal(state.pools[0].identityPoolId, input.credentials.identityPoolId)
  assert.equal(state.pools[0].clientConfig.region, input.credentials.region)
  assert.equal(state.destroyed, 1)
})

test('Amazon Translate explicit languages are serialized unchanged', async () => {
  const state = bridge({ body: { TranslatedText: 'Bonjour.' } })
  assert.equal(
    await state.translate({ ...input, from: 'en', to: 'fr' }),
    'Bonjour.',
  )
  assert.equal(JSON.parse(state.requests[0].body).SourceLanguageCode, 'en')
  assert.equal(JSON.parse(state.requests[0].body).TargetLanguageCode, 'fr')
})

test('Amazon Translate service failures retain the message and report why translation failed', async () => {
  const state = bridge({
    statusCode: 400,
    body: { __type: 'AccessDeniedException', message: 'Translation denied' },
  })
  assert.equal(await state.translate(input), input.text)
  assert.equal(state.errors.length, 1)
  assert.match(state.errors[0][1].message, /Translation denied/)
  assert.equal(state.destroyed, 1)
})

test('Cognito failures are visible and do not make a translation request', async () => {
  const state = bridge({
    credentialError: new Error('Missing identity pool credentials'),
  })
  assert.equal(await state.translate(input), input.text)
  assert.equal(state.requests.length, 0)
  assert.equal(state.errors.length, 1)
  assert.equal(state.clients.length, 0)
})
