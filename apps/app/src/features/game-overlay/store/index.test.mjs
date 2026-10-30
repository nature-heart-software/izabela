import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { createPinia } from 'pinia'
import { createApp, nextTick, toRaw } from 'vue'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

const filename = fileURLToPath(new URL('./index.ts', import.meta.url))
const { useGameOverlayStore } = loadTypescript(filename)
const clone = (value) => structuredClone(toRaw(value))
const toolbox = {
  ...loadTypescript(
    fileURLToPath(
      new URL(
        '../../../../../../packages/toolbox/src/utils/object.ts',
        import.meta.url,
      ),
    ),
  ),
  ...loadTypescript(
    fileURLToPath(
      new URL(
        '../../../../../../packages/toolbox/src/utils/promise.ts',
        import.meta.url,
      ),
    ),
  ),
}

function fixture(saved) {
  const records = new Map()
  const key = 'electron-pinia-game-overlay'
  if (saved) records.set(key, clone(saved))
  const messages = []
  const { plugin } = loadTypescript(
    fileURLToPath(
      new URL(
        '../../../../../../packages/electron-pinia/src/plugin.ts',
        import.meta.url,
      ),
    ),
    {
      '@packages/toolbox': toolbox,
      './background': {},
      './electron': {
        isMain: false,
        isPreload: false,
        isRenderer: true,
        ipcRenderer: {
          SEND_IPC_EVENT_CONNECT: async () => 7,
          SEND_IPC_EVENT_NOTIFY_MAIN: (payload) =>
            messages.push(clone(payload)),
          ON_IPC_EVENT_NOTIFY_RENDERERS() {},
        },
      },
    },
    {
      window: {
        ElectronPiniaStorage: {
          get: (name) => records.get(name),
          set: (name, state) => records.set(name, clone(state)),
        },
      },
    },
  )
  const pinia = createPinia().use(plugin())
  createApp({}).use(pinia)
  const store = useGameOverlayStore(pinia)
  return { store, records, key, messages }
}

test('both overlays default off and the experimental choice is persisted and shared independently', async () => {
  const { store, records, key, messages } = fixture()
  await store.$whenReady()
  assert.equal(store.enableGameOverlay, false)
  assert.equal(store.enableExperimentalGameOverlay, false)
  store.$patch({ enableExperimentalGameOverlay: true })
  await nextTick()
  assert.equal(store.enableGameOverlay, false)
  assert.equal(records.get(key).enableExperimentalGameOverlay, true)
  assert.equal(messages.length, 1)
  assert.equal(messages[0].storeId, 'game-overlay')
  assert.equal(messages[0].args[0].enableExperimentalGameOverlay, true)
  const restored = fixture(records.get(key)).store
  await restored.$whenReady()
  assert.equal(restored.enableExperimentalGameOverlay, true)
  assert.equal(restored.enableGameOverlay, false)
})

for (const enableGameOverlay of [false, true]) {
  test(`loading legacy saved ${enableGameOverlay} does not migrate it into experimental opt-in`, async () => {
    const { store } = fixture({
      enableGameOverlay,
      allowlist: ['saved-game.exe'],
    })
    await store.$whenReady()
    assert.equal(store.enableGameOverlay, enableGameOverlay)
    assert.equal(store.enableExperimentalGameOverlay, false)
    assert.deepEqual([...store.allowlist], ['saved-game.exe'])
  })
}
