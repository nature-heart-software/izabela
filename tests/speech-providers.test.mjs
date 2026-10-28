import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import test from 'node:test'
import express from 'express'
import loadTypescript from './load-typescript.cjs'

const require = createRequire(
  new URL('../apps/app-server/package.json', import.meta.url),
)
const sdk = require('@aws-sdk/client-polly')

async function polly(t, { includeTimestamps = false, fail = false } = {}) {
  const requests = []
  const pools = []
  const app = express()
  app.use(express.json())
  const plugin = loadTypescript(
    fileURLToPath(
      new URL(
        '../apps/app-server/src/plugins/speech-apis/ap.ts',
        import.meta.url,
      ),
    ),
    {
      '@aws-sdk/client-polly': {
        ...sdk,
        Polly: class extends sdk.Polly {
          constructor(config) {
            super({
              ...config,
              maxAttempts: 1,
              requestHandler: {
                async handle(request) {
                  const payload = JSON.parse(
                    Buffer.from(request.body).toString(),
                  )
                  requests.push(payload)
                  const marks = payload.OutputFormat === 'json'
                  return {
                    response: {
                      statusCode: fail ? 400 : 200,
                      headers: {
                        'content-type': fail
                          ? 'application/json'
                          : marks
                          ? 'application/x-json-stream'
                          : 'audio/mpeg',
                      },
                      body: Readable.from([
                        fail
                          ? JSON.stringify({
                              __type: 'InvalidParameterValueException',
                              message: 'Engine unavailable',
                            })
                          : marks
                          ? '{"time":1,"value":"Hello"}\n'
                          : Buffer.from([0xff, 0xfb, 0x01, 0x02]),
                      ]),
                    },
                  }
                },
              },
            })
          }
        },
      },
      '@aws-sdk/credential-provider-cognito-identity': {
        fromCognitoIdentityPool(config) {
          pools.push(config)
          return async () => ({
            accessKeyId: 'synthetic-id',
            secretAccessKey: 'synthetic-secret',
          })
        },
      },
      '../../utils/requests': {
        handleError: (res, _, message, status) =>
          res.status(status).json({ error: message }),
      },
    },
  ).default
  plugin({ app })
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  const response = await fetch(
    `http://127.0.0.1:${
      server.address().port
    }/api/tts/amazon-polly/synthesize-speech/stream`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        credentials: { region: 'eu-west-1', identityPoolId: 'synthetic-pool' },
        payload: { Text: 'Hello.', VoiceId: 'Amy', Engine: 'neural' },
        includeTimestamps,
      }),
    },
  )
  const bytes = Buffer.from(await response.arrayBuffer())
  return { response, bytes, requests, pools }
}

test('Polly app-server synthesis returns real SDK streaming bytes over HTTP', async (t) => {
  const state = await polly(t)
  assert.equal(state.response.status, 200)
  assert.equal(state.response.headers.get('content-type'), 'audio/mpeg')
  assert.deepEqual(state.bytes, Buffer.from([0xff, 0xfb, 0x01, 0x02]))
  assert.deepEqual(state.requests, [
    { Text: 'Hello.', VoiceId: 'Amy', Engine: 'neural', OutputFormat: 'mp3' },
  ])
  assert.equal(state.pools[0].clientConfig.region, 'eu-west-1')
})

test('Polly audio with timestamps survives SDK deserialization and HTTP delivery', async (t) => {
  const state = await polly(t, { includeTimestamps: true })
  assert.equal(state.response.status, 200)
  assert.deepEqual(state.bytes, Buffer.from([0xff, 0xfb, 0x01, 0x02]))
  assert.deepEqual(JSON.parse(state.response.headers.get('data')), {
    timestamps: [{ time: 1, value: 'Hello' }],
  })
  assert.equal(state.requests.length, 2)
  assert.deepEqual(state.requests[1].SpeechMarkTypes, ['word'])
})

test('Polly service failures reach the caller instead of returning unusable audio', async (t) => {
  const state = await polly(t, { fail: true })
  assert.equal(state.response.status, 500)
  assert.match(JSON.parse(state.bytes).error, /Engine unavailable/)
})
