import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import loadTypescript from '../../../../tests/load-typescript.cjs'

const source = (path) => fileURLToPath(new URL(path, import.meta.url))

function preloadFixture({ contractSource } = {}) {
  const exposed = new Map()
  const invocations = []
  const imports = []
  const electron = {
    contextBridge: {
      exposeInMainWorld(name, methods) {
        assert.equal(exposed.has(name), false, `Duplicate exposure: ${name}`)
        exposed.set(name, methods)
      },
    },
    ipcRenderer: {
      invoke(channel, ...args) {
        invocations.push([channel, ...args])
        return Promise.resolve({ channel, args })
      },
    },
  }
  const mocks = new Proxy(
    {
      electron,
      get './bridge-contract'() {
        return loadTypescript(
          source('./bridge-contract.ts'),
          mocks,
          {},
          contractSource,
        )
      },
      '@packages/electron-pinia/preload': {},
      '@/modules/electron-log/preload': {},
      '@/plugins/preload': {},
      'electron-postman': { ipcRenderer: { exposeInMainWorld() {} } },
      get '@packages/electron-bridger'() {
        return loadTypescript(
          source('../../../../packages/electron-bridger/src/main.ts'),
          mocks,
          { window: {} },
        )
      },
      get '@/electron/bridge'() {
        return loadTypescript(source('./bridge.ts'), mocks)
      },
    },
    {
      getOwnPropertyDescriptor(target, key) {
        imports.push(key)
        if (Object.hasOwn(target, key))
          return Object.getOwnPropertyDescriptor(target, key)
        if (String(key).startsWith('.')) return undefined
        throw new Error(`Main-only implementation reached from preload: ${key}`)
      },
    },
  )
  loadTypescript(source('./preload.ts'), mocks, { window: {} })
  return { exposed, invocations, imports, electron }
}

test('application preload exposes IPC without importing main-only implementations', () => {
  let fixture
  assert.doesNotThrow(() => {
    fixture = preloadFixture()
  })
  assert.equal(fixture.exposed.size, 10)
  assert.ok(fixture.exposed.has('ElectronSpeechWorkerWindow'))
  assert.equal(fixture.imports.includes('@/electron/bridge'), false)
})

function mainFixture() {
  const handlers = new Map()
  const displays = [{ id: 7, bounds: { x: 0, y: 0, width: 800, height: 600 } }]

  const electron = {
    ipcMain: {
      handle(channel, handler) {
        assert.equal(
          handlers.has(channel),
          false,
          `Duplicate handler: ${channel}`,
        )
        handlers.set(channel, handler)
      },
    },
    screen: { getAllDisplays: () => displays },
  }
  const boundaries = {
    electron,
    '@root/package.json': { productName: 'Bridge test' },
    '@/modules/electron-window-manager': {},
    '@/utils/electron-notification.ts': {},
    '@/utils/electron-notification': {},
    '@/modules/node-mouse': {},
    '@/teams/messenger/store': {},
    '@/features/settings/store': {},
    '@/features/speech/store': {},
    '@/modules/vue-hitboxes/hitboxes.store': {},
    '@/utils/electron-window': {},
    '@/electron/game-overlay-backend': {},
    '@/modules/electron-overlay-defender': {
      addOverlayInjectorDefenderExclusions: async () => ({
        status: 'cancelled',
      }),
    },
    '@/features/display/utils': {},
    '@/modules/electron-keybinding/utils': {},
    '@/electron/events/main': {},
    '@/teams/overlay/store': {},
    '@/teams/speech-worker/modules/electron-native-speech-recognition': {},
    '@/utils/time': {},
    '@/teams/speech-worker/electron/const': {},
    '@/modules/speech-recognition-engine-manager': {},
    '@/electron/utils': { EXTERNALS_DIR: '/controlled-externals' },
    '@packages/toolbox': {
      Deferred: () => ({ promise: new Promise(() => {}) }),
    },
    forcefocus: {},
    koffi: { load: () => ({ func: () => () => {} }) },
    '@packages/native-keymap': {},
    '@google-cloud/speech': {},
    '@google-cloud/translate': {},
    'electron-postman': {},
    systeminformation: {},
    '@vscode/sudo-prompt': {},
    clipboardy: {},
    'node-abi': {},
  }
  // Load the real exported instances; only their Electron/SDK/store dependencies
  // are controlled. Never substitute a hand-maintained list of implementation keys.
  const implementations = new Map()
  const paths = [
    '@/modules/electron-dialog',
    '@/modules/electron-filesystem',
    '@/teams/messenger/modules/electron-messenger-window',
    '@/teams/overlay/modules/electron-overlay-window',
    '@/teams/speech-worker/modules/electron-speech-worker-window',
    '@/modules/electron-keybinding',
    '@/modules/electron-display',
    '@/modules/electron-resources',
    '@/modules/electron-si',
    '@/modules/electron-translation',
  ]
  for (const id of paths) {
    Object.defineProperty(boundaries, id, {
      get() {
        if (!implementations.has(id)) {
          implementations.set(
            id,
            loadTypescript(source(`../${id.slice(2)}/index.ts`), boundaries, {
              process,
            }),
          )
        }
        return implementations.get(id)
      },
    })
  }
  boundaries['@packages/electron-bridger'] = loadTypescript(
    source('../../../../packages/electron-bridger/src/main.ts'),
    { electron },
  )
  loadTypescript(source('./bridge.ts'), boundaries).bridgeModules()
  return { handlers, displays, implementations, electron }
}

function exposedChannels(exposed) {
  return [...exposed]
    .flatMap(([name, methods]) =>
      Object.keys(methods).map((method) => `${name}-${method}`),
    )
    .sort()
}

function assertParity(preload, main) {
  assert.deepEqual(
    exposedChannels(preload.exposed),
    [...main.handlers.keys()].sort(),
  )
}

test('every preload method forwards its exact channel, arguments and result', async () => {
  const fixture = preloadFixture()
  for (const [name, methods] of fixture.exposed) {
    for (const [method, invoke] of Object.entries(methods)) {
      const args = ['text', { nested: [1, null, false] }, undefined]
      const result = await invoke(...args)
      const channel = `${name}-${method}`
      assert.equal(result.channel, channel)
      assert.deepEqual(result.args, args)
      assert.deepEqual(fixture.invocations.at(-1), [channel, ...args])
    }
  }
  assert.equal(
    fixture.invocations.length,
    exposedChannels(fixture.exposed).length,
  )
})

test('actual main registrations exactly match the preload contract', (t) => {
  const main = mainFixture()
  assert.equal(main.implementations.size, 10)
  assertParity(preloadFixture(), main)
  t.diagnostic(
    `${main.handlers.size} IPC methods across ${main.implementations.size} real modules`,
  )
})

test('parity rejects a contract that silently omits an existing main method', () => {
  const contractSource = readFileSync(
    source('./bridge-contract.ts'),
    'utf8',
  ).replace('showOpenDialog: true,', '')
  const preload = preloadFixture({ contractSource })
  assert.equal('showOpenDialog' in preload.exposed.get('ElectronDialog'), false)
  assert.throws(() => assertParity(preload, mainFixture()), {
    code: 'ERR_ASSERTION',
  })
})

test('preload proxies reach real main implementations through the Electron boundary', async () => {
  const preload = preloadFixture()
  const main = mainFixture()
  preload.electron.ipcRenderer.invoke = async (channel, ...args) => {
    const handler = main.handlers.get(channel)
    assert.ok(handler, `Missing handler: ${channel}`)
    return structuredClone(await handler({}, ...structuredClone(args)))
  }
  assert.deepEqual(
    await preload.exposed.get('ElectronDisplay').getAllDisplays(),
    main.displays,
  )
  assert.equal(
    await preload.exposed
      .get('ElectronTranslation')
      .translate('unchanged', { to: 'fr' }),
    'unchanged',
  )
  const error = new Error('Controlled screen failure')
  main.electron.screen.getAllDisplays = () => {
    throw error
  }
  await assert.rejects(
    preload.exposed.get('ElectronDisplay').getAllDisplays(),
    (actual) => actual === error,
  )
})

test('preload proxies propagate invocation rejections unchanged', async () => {
  const preload = preloadFixture()
  const error = new Error('Controlled IPC rejection')
  preload.electron.ipcRenderer.invoke = () => Promise.reject(error)
  await assert.rejects(
    preload.exposed.get('ElectronDialog').showOpenDialog({}),
    (actual) => actual === error,
  )
})
