import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { builtinModules, createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build, loadConfigFromFile } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const app = resolve(root, 'apps/app')
const require = createRequire(import.meta.url)

test('production Cognito lazy loading does not reinitialize the app entrypoint', async () => {
  // Keep the real store module and Cognito loader in the same entry graph as
  // production. Mock only the AWS transport; no credentials or network are used.
  const directory = await mkdtemp(resolve(app, '.speech-bundle-test-'))
  const entry = resolve(directory, 'entry.ts')
  const output = resolve(directory, 'dist')
  const key = `speech-bundle-${Date.now()}`
  await writeFile(
    entry,
    `
    import Store from 'electron-store'
    import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
    import { Readable } from 'node:stream'
    import { SpeechConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk'
    export const recognizerClass = SpeechRecognizer
    export const speechConfig = SpeechConfig.fromSubscription('fixture', 'westus')
    export const storageClass = Store
    const key = ${JSON.stringify(key)}
    globalThis[key] = (globalThis[key] || 0) + 1
    if (globalThis[key] !== 1) throw new Error('App entrypoint initialized twice')
    export const getCredentials = fromCognitoIdentityPool({
      identityPoolId: 'eu-west-1:synthetic-pool',
      clientConfig: {
        region: 'eu-west-1',
        requestHandler: { async handle(request) {
          const getId = request.headers['x-amz-target'].endsWith('.GetId')
          return { response: {
            statusCode: 200,
            headers: { 'content-type': 'application/x-amz-json-1.1' },
            body: Readable.from([JSON.stringify(getId
              ? { IdentityId: 'eu-west-1:synthetic-identity' }
              : { Credentials: { AccessKeyId: 'synthetic-id', SecretKey: 'synthetic-secret', SessionToken: 'synthetic-token', Expiration: 2000000000 } })]),
          } }
        } },
      },
    })
  `,
  )
  try {
    const loaded = await loadConfigFromFile(
      { command: 'build', mode: 'production' },
      resolve(app, 'vite.config.ts'),
    )
    assert.ok(loaded, 'production Vite config must load')
    const external = loaded.config.build.rollupOptions.external
    await build({
      configFile: false,
      publicDir: false,
      logLevel: 'error',
      resolve: {
        browserField: false,
        conditions: ['node'],
        mainFields: ['module', 'jsnext:main', 'jsnext'],
      },
      define: { 'process.env': 'process.env' },
      build: {
        outDir: output,
        lib: { entry, formats: ['cjs'], fileName: () => 'entry.cjs' },
        rollupOptions: {
          external: [
            ...builtinModules,
            ...builtinModules.map((id) => `node:${id}`),
            'electron',
            ...external,
          ],
        },
      },
    })
    const fixture = require(resolve(output, 'entry.cjs'))
    assert.equal(typeof fixture.storageClass, 'function')
    assert.equal(typeof fixture.recognizerClass, 'function')
    assert.equal(fixture.speechConfig.region, 'westus')
    fixture.speechConfig.close()
    const credentials = await fixture.getCredentials()
    assert.equal(credentials.accessKeyId, 'synthetic-id')
    assert.equal(credentials.secretAccessKey, 'synthetic-secret')
    assert.equal(credentials.sessionToken, 'synthetic-token')
    assert.equal(globalThis[key], 1)
  } finally {
    delete globalThis[key]
    // Only this test's mkdtemp directory inside apps/app is removed.
    assert.equal(dirname(directory), app)
    await rm(directory, { recursive: true, force: true, maxRetries: 5 })
  }
})
