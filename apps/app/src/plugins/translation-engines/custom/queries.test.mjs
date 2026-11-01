import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import * as vue from 'vue'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

test('custom language catalog sends the API key and scopes cached data to endpoint and credentials', async () => {
  const state = vue.reactive({
    endpoint: 'https://fixture.invalid/',
    apiKey: 'encrypted-key',
  })
  const requests = []
  let query
  loadTypescript(fileURLToPath(new URL('./queries.ts', import.meta.url)), {
    vue,
    'vue-query': {
      useQuery: (options) => {
        query = { key: options.queryKey, fn: options.queryFn, options }
        return query
      },
    },
    axios: {
      post: async (...args) => {
        requests.push(args)
        return {
          data: {
            from: [{ id: 'en', name: 'English' }],
            to: [
              { id: 'fr', name: 'French' },
              { id: 'legacy', value: 'de', name: 'German' },
            ],
          },
        }
      },
    },
    './store': {
      store: {
        getProperty: (name, decrypt) =>
          name === 'apiKey' && decrypt ? 'actual-key' : state[name],
      },
    },
    './shared.ts': { ENGINE_ID: 'custom-translation' },
  }).useGetLanguagesQuery()
  const firstKey = [...query.key.value]
  const catalog = await query.fn()
  assert.equal(catalog.from[0].value, 'en')
  assert.equal(catalog.to[0].value, 'fr')
  assert.equal(catalog.to[1].value, 'de')
  assert.equal(requests[0][0], 'https://fixture.invalid/languages')
  assert.equal(requests[0][1].credentials.apiKey, 'actual-key')
  assert.ok(
    !query.key.value.includes('actual-key'),
    'Plaintext credentials leaked into the cache key',
  )
  state.endpoint = 'https://other.invalid'
  state.apiKey = 'encrypted-replacement'
  assert.notDeepEqual([...query.key.value], firstKey)
  state.endpoint = ''
  assert.equal(query.options.enabled.value, false)
})
