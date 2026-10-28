import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as vue from 'vue'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'
const filename = fileURLToPath(
  new URL('./NvGoogleCloudCredentialsFormPart.vue', import.meta.url),
)
const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
const { content } = compileScript(descriptor, { id: filename })
function setup(result, fail = false) {
  const imported = [],
    refreshed = []
  const component = loadTypescript(
    filename,
    {
      vue,
      '@packages/ui': {},
      '@/features/settings/hooks': {
        getGoogleCloudSpeechCredentialsPathQueryKey: ['credentials'],
        useGetGoogleCloudSpeechCredentialsPath: () => ({
          data: vue.ref('saved.json'),
        }),
      },
      'vue-query': {
        useQueryClient: () => ({
          refetchQueries: (...args) => refreshed.push(args),
        }),
      },
    },
    {
      window: {
        ElectronDialog: { showOpenDialog: async () => result },
        ElectronFilesystem: {
          async importGoogleCloudSpeechCredentials(file) {
            imported.push(file)
            if (fail) throw Error('invalid')
          },
        },
      },
    },
    content,
  ).default
  return { ...component.setup({}, { expose() {} }), imported, refreshed }
}

test('canceling the credential dialog preserves credentials and makes no import request', async () => {
  for (const result of [{ canceled: true, filePaths: [] }, { filePaths: [] }]) {
    const f = setup(result)
    await f.importGoogleCloudSpeechCredentials()
    assert.deepEqual(f.imported, [])
    assert.deepEqual(f.refreshed, [])
    assert.equal(f.importError.value, '')
  }
})
test('invalid import is shown and a later valid import refreshes credentials', async () => {
  const bad = setup({ filePaths: ['bad.json'] }, true)
  await bad.importGoogleCloudSpeechCredentials()
  assert.match(bad.importError.value, /Could not import/)
  assert.equal(bad.refreshed.length, 0)
  const good = setup({ filePaths: ['good.json'] })
  await good.importGoogleCloudSpeechCredentials()
  assert.deepEqual(good.imported, ['good.json'])
  assert.equal(good.refreshed.length, 1)
})
