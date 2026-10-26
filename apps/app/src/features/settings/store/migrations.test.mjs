import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

function loadStartup(settings, whenReady) {
  const empty = () => ({})
  const manager = { getEngines: () => [] }
  const mocks = {
    '@/features/speech/store': {
      useSpeechStore: empty,
      useSpeechRecognitionStore: empty,
    },
    '@/modules/vue-hitboxes/hitboxes.store.ts': { useHitboxesStore: empty },
    '@/store/use-confirm-store.ts': { useConfirmStore: empty },
    '@/features/databases/store': { useDatabasesStore: empty },
    '@/features/dictionary/store': { useDictionaryStore: empty },
    '@/features/messages/store.ts': {
      useMessagesStore: empty,
      usePlayingMessageStore: empty,
    },
    '@/teams/messenger/store': { useMessengerStore: empty },
    '@/features/profiles/store.ts': { useProfilesStore: empty },
    '@/features/settings/store': { useSettingsStore: () => settings },
    '@/features/game-overlay/store': { useGameOverlayStore: empty },
    '@/modules/speech-recognition-engine-manager': manager,
    '@/modules/speech-engine-manager': manager,
    '@/modules/translation-engine-manager': manager,
    '@/store/index.ts': {
      storesStates: { settings: { $whenReady: () => whenReady } },
    },
  }
  Object.defineProperty(mocks, '@/features/settings/store/migrations', {
    get: () =>
      loadTypescript(
        fileURLToPath(new URL('./migrations.ts', import.meta.url)),
      ),
  })
  return loadTypescript(
    fileURLToPath(new URL('../../../store/stores.ts', import.meta.url)),
    mocks,
  )
}

test('all published legacy regional origins migrate to the global endpoint', () => {
  const { migrateUniversalApiEndpoint } = loadTypescript(
    fileURLToPath(new URL('./migrations.ts', import.meta.url)),
  )
  const regions = [
    'arn1',
    'bom1',
    'cdg1',
    'cle1',
    'cpt1',
    'dub1',
    'fra1',
    'gru1',
    'hkg1',
    'hnd1',
    'iad1',
    'icn1',
    'kix1',
    'lhr1',
    'pdx1',
    'sfo1',
    'sin1',
    'syd1',
  ]
  for (const region of regions) {
    for (const suffix of ['', '/', '/api/', '/api?example=value#fragment']) {
      const endpoint = `https://izabela-server-${region}.vercel.app${suffix}`
      assert.equal(
        migrateUniversalApiEndpoint(endpoint),
        'https://api.izabela.app',
      )
    }
  }
  assert.equal(
    migrateUniversalApiEndpoint('http://izabela-server-fra1.vercel.app'),
    'https://api.izabela.app',
  )
  assert.equal(
    migrateUniversalApiEndpoint(
      'https://IZABELA-SERVER-FRA1.VERCEL.APP:443/api',
    ),
    'https://api.izabela.app',
  )
})

test('custom endpoints, lookalikes and incomplete input stay byte-for-byte unchanged', () => {
  const { migrateUniversalApiEndpoint } = loadTypescript(
    fileURLToPath(new URL('./migrations.ts', import.meta.url)),
  )
  for (const endpoint of [
    '',
    'not a URL',
    'https://',
    'https://api.izabela.app',
    'https://api.izabela.app/custom?setting=value',
    'http://localhost:7070',
    'https://custom.vercel.app',
    'https://izabela-server-unknown.vercel.app',
    'https://izabela-server-fra1-preview.vercel.app',
    'https://izabela-server-fra1.vercel.app.example.test',
    'https://izabela-server-fra1.vercel.app@custom.example.test',
    'https://custom.example.test/izabela-server-fra1.vercel.app',
    'https://izabela-server-fra1.vercel.app:8443',
    'https://username@izabela-server-fra1.vercel.app',
    'ftp://izabela-server-fra1.vercel.app',
  ]) {
    assert.equal(migrateUniversalApiEndpoint(endpoint), endpoint)
  }
})

test('startup leaves custom endpoints and keys untouched without writing settings', async () => {
  const writes = []
  const settings = {
    universalApiEndpoint: 'https://custom.example.test/api/',
    universalApiKey: 'encrypted-membership-sentinel',
    $patch: (patch) => writes.push(patch),
  }
  await loadStartup(settings, Promise.resolve(true)).loadStores()
  assert.equal(
    settings.universalApiEndpoint,
    'https://custom.example.test/api/',
  )
  assert.equal(settings.universalApiKey, 'encrypted-membership-sentinel')
  assert.deepEqual(writes, [])
})

test('startup migration is idempotent', async () => {
  const writes = []
  const settings = {
    universalApiEndpoint: 'https://izabela-server-syd1.vercel.app/',
    $patch(patch) {
      writes.push(patch)
      Object.assign(this, patch)
    },
  }
  const { loadStores } = loadStartup(settings, Promise.resolve(true))
  await loadStores()
  await loadStores()
  assert.equal(settings.universalApiEndpoint, 'https://api.izabela.app')
  assert.equal(writes.length, 1)
})

test('startup migrates a restored regional endpoint only after settings are ready', async () => {
  let finish
  const whenReady = new Promise((resolve) => {
    finish = resolve
  })
  const writes = []
  const settings = {
    universalApiEndpoint: '',
    universalApiKey: 'encrypted-membership-sentinel',
    $patch(patch) {
      writes.push(patch)
      Object.assign(this, patch)
    },
  }
  const { loadStores } = loadStartup(settings, whenReady)
  const ready = loadStores()
  assert.deepEqual(writes, [])
  settings.universalApiEndpoint = 'https://izabela-server-fra1.vercel.app/api/'
  finish(true)
  await ready
  assert.equal(settings.universalApiEndpoint, 'https://api.izabela.app')
  assert.equal(settings.universalApiKey, 'encrypted-membership-sentinel')
  assert.deepEqual(JSON.parse(JSON.stringify(writes)), [
    { universalApiEndpoint: 'https://api.izabela.app' },
  ])
})
