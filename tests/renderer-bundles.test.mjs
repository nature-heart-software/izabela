import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, resolve } from 'node:path'
import { build } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from './load-typescript.cjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appRequire = createRequire(resolve(root, 'apps/app/package.json'))
const vue = appRequire('vue')
const { createMemoryHistory, createRouter } = appRequire('vue-router')
const { createRenderer, defineComponent, h, nextTick } = vue
const plugins = resolve(root, 'apps/app/src/plugins')
const registrations = readdirSync(plugins, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap(({ name: category }) =>
    readdirSync(resolve(plugins, category), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map(({ name: provider }) => ({
        category,
        provider,
        filename: resolve(plugins, category, provider, 'register.ts'),
      })),
  )

// Use Vue's client renderer without a browser or native Electron dependencies.
const renderer = createRenderer({
  createElement: (type) => ({ type, children: [], props: {} }),
  createText: (text) => ({ text }),
  createComment: (text) => ({ comment: text }),
  setText: (node, text) => {
    node.text = text
  },
  setElementText: (node, text) => {
    node.text = text
    node.children = []
  },
  patchProp: (node, key, previous, value) => {
    node.props[key] = value
  },
  parentNode: (node) => node.parent,
  nextSibling: () => null,
  insert(node, parent, anchor = null) {
    if (node.parent) this.remove(node)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
    node.parent = parent
  },
  remove(node) {
    if (node.parent) {
      const siblings = node.parent.children
      siblings.splice(siblings.indexOf(node), 1)
      node.parent = null
    }
  },
})

function componentBoundary(name, loaded) {
  const component = defineComponent({
    name,
    props: { label: { type: String, default: 'default label' } },
    setup(props, { attrs, slots }) {
      return () => h('section', attrs, [props.label, slots.default?.()])
    },
  })
  return {
    __esModule: true,
    get default() {
      loaded.push(name)
      return component
    },
  }
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve))
  await nextTick()
}

function text(node) {
  return (node.text || '') + (node.children || []).map(text).join('')
}

function loadRegistration({ category, provider, filename }) {
  const loaded = []
  const captured = []
  const store = { getProperty: () => undefined }
  const engineOptions = { store, start: () => {}, stop: () => {} }
  const registerEngine = (...args) => {
    const options = args.at(-1)
    captured.push(options)
    return options
  }
  const shared = {
    ENGINE_ID: provider,
    ENGINE_NAME: provider,
    getVoiceName: () => provider,
  }
  const mocks = {
    vue,
    '@/services': {},
    '@/modules/speech-engine-manager': { registerEngine },
    '@/modules/speech-recognition-engine-manager': { registerEngine },
    '@/modules/translation-engine-manager': { registerEngine },
    '@/features/speech/store': {
      useSpeechStore: () => ({ customCommands: [] }),
    },
    '@/consts': { DEFAULT_LANGUAGE_CODE: 'en-US' },
    '@/consts.ts': { DEFAULT_LANGUAGE_CODE: 'en-US' },
    '@packages/animalese': {},
    'sam-js': class {},
    './shared': shared,
    './shared.ts': shared,
    './store': { store, getProperty: store.getProperty },
    './store.ts': { store, getProperty: store.getProperty },
    './engine-options.ts': engineOptions,
    './NvSettings.vue': componentBoundary(
      `${category}/${provider}/settings`,
      loaded,
    ),
    './NvVoiceSelect.vue': componentBoundary(
      `${category}/${provider}/voices`,
      loaded,
    ),
  }
  loadTypescript(filename, mocks)
  assert.equal(
    captured.length,
    1,
    'registration still happens synchronously once',
  )
  return { engine: captured[0], loaded, store, engineOptions }
}

test('provider registration leaves UI unloaded until the component is rendered', async (t) => {
  assert.equal(registrations.length, 24, 'cover every provider registration')
  for (const registration of registrations) {
    await t.test(
      `${registration.category}/${registration.provider}`,
      async () => {
        const { engine, loaded, store, engineOptions } =
          loadRegistration(registration)
        assert.deepEqual(
          loaded,
          [],
          'registering an execution engine must not evaluate its UI',
        )
        assert.equal(engine.store, store, 'store ownership is unchanged')
        if (registration.category === 'speech-recognition-engines') {
          assert.equal(engine.start, engineOptions.start)
          assert.equal(engine.stop, engineOptions.stop)
        } else {
          assert.equal(typeof engine.getCredentials, 'function')
          assert.equal(
            typeof engine.getPayload === 'function' ||
              typeof engine.translate === 'function',
            true,
          )
        }
        if (
          registration.category === 'speech-recognition-engines' &&
          registration.provider === 'custom'
        ) {
          assert.equal(
            engine.settingsComponent,
            null,
            'custom recognition keeps its intentionally absent UI',
          )
          return
        }
        const components = [['settingsComponent', 'settings']]
        if (registration.category === 'speech-engines')
          components.push(['voiceSelectComponent', 'voices'])
        for (const [key, suffix] of components) {
          const component = engine[key]
          const expectedName = `${registration.category}/${registration.provider}/${suffix}`
          const container = { children: [] }
          try {
            renderer.render(
              h(component, { class: 'forwarded' }, () => 'default slot'),
              container,
            )
            await settle()
            assert.equal(
              text(container),
              'default labeldefault slot',
              'default props and slots survive resolution',
            )
            assert.equal(container.children[0].props.class, 'forwarded')
            renderer.render(
              h(component, { label: 'updated label' }, () => 'updated slot'),
              container,
            )
            await settle()
            assert.equal(
              text(container),
              'updated labelupdated slot',
              'resolved component remains reactive',
            )
            renderer.render(null, container)
            renderer.render(h(component, { label: 'remounted' }), container)
            await settle()
            assert.equal(text(container), 'remounted')
            assert.equal(
              loaded.filter((name) => name === expectedName).length,
              1,
              'resolved UI is reused on remount',
            )
          } finally {
            renderer.render(null, container)
          }
        }
        assert.deepEqual(
          loaded,
          components.map(
            ([, suffix]) =>
              `${registration.category}/${registration.provider}/${suffix}`,
          ),
        )
      },
    )
  }
})

const messengerRoutes = [
  ['settings', '/settings', 'NvSettings'],
  ['settings-general', '/settings/general', 'NvSettingsGeneral'],
  ['settings-game-overlay', '/settings/game-overlay', 'NvSettingsGameOverlay'],
  ['settings-profiles', '/settings/profiles', 'NvSettingsProfiles'],
  ['settings-engine', '/settings/engine', 'NvSettingsEngine'],
  [
    'settings-audio-outputs',
    '/settings/audio-outputs',
    'NvSettingsAudioOutputs',
  ],
  ['settings-audio-input', '/settings/audio-input', 'NvSettingsAudioInput'],
  ['settings-translation', '/settings/translation', 'NvSettingsTranslation'],
  ['settings-dictionary', '/settings/dictionary', 'NvSettingsDictionary'],
  ['settings-commands', '/settings/commands', 'NvSettingsCommands'],
  ['settings-about', '/settings/about', 'NvSettingsAbout'],
  ['settings-support', '/settings/support', 'NvSettingsSupport'],
  ['messages', '/messages', 'NvMessages'],
  ['messages-history', '/messages/history', 'NvMessagesHistory'],
  ['messages-shortcuts', '/messages/shortcuts', 'NvMessagesShortcuts'],
]

test('messenger views load only on navigation and keep route names, nesting and history', async () => {
  const loaded = []
  const mocks = {
    'vue-router': { createRouter, createWebHashHistory: createMemoryHistory },
  }
  for (const [, , component] of messengerRoutes) {
    mocks[`@/teams/messenger/views/${component}.vue`] = componentBoundary(
      component,
      loaded,
    )
  }
  const router = loadTypescript(
    resolve(root, 'apps/app/src/teams/messenger/router/index.ts'),
    mocks,
  ).default
  assert.deepEqual(
    loaded,
    [],
    'constructing the router must not evaluate unvisited views',
  )
  assert.equal(router.getRoutes().length, messengerRoutes.length)
  for (const [name, path] of messengerRoutes) {
    assert.equal(router.resolve({ name }).path, path)
  }

  // Start at a child URL to exercise direct history-route entry and its parent.
  await router.push('/messages/history')
  assert.deepEqual(loaded, ['NvMessages', 'NvMessagesHistory'])
  assert.deepEqual(
    router.currentRoute.value.matched.map((route) => route.name),
    ['messages', 'messages-history'],
  )
  const visited = new Set(loaded)
  for (const [name, path, component] of messengerRoutes) {
    const previous = loaded.length
    await router.push({ name })
    assert.equal(router.currentRoute.value.path, path)
    assert.equal(
      router.currentRoute.value.matched.at(-1).components.default.name,
      component,
    )
    assert.deepEqual(
      loaded.slice(previous),
      visited.has(component) ? [] : [component],
      'navigation loads only the requested new view',
    )
    visited.add(component)
  }
  assert.equal(visited.size, messengerRoutes.length)
  const previous = loaded.length
  await router.push('/settings/general')
  await router.push('/messages/history')
  const navigated = new Promise((resolve) => {
    const remove = router.afterEach(() => {
      remove()
      resolve()
    })
  })
  router.back()
  await navigated
  assert.equal(router.currentRoute.value.path, '/settings/general')
  assert.equal(
    loaded.length,
    previous,
    'back navigation reuses loaded route components',
  )
})

const routerFile = resolve(root, 'apps/app/src/teams/messenger/router/index.ts')
const providerViews = registrations.flatMap(
  ({ category, provider, filename }) => {
    if (category === 'speech-recognition-engines' && provider === 'custom')
      return []
    const views = [resolve(dirname(filename), 'NvSettings.vue')]
    if (category === 'speech-engines')
      views.push(resolve(dirname(filename), 'NvVoiceSelect.vue'))
    return views
  },
)
const views = new Set([
  ...providerViews,
  ...messengerRoutes.map(([, , name]) =>
    resolve(root, `apps/app/src/teams/messenger/views/${name}.vue`),
  ),
])
const entries = new Set([
  ...registrations.map(({ filename }) => filename),
  routerFile,
])
const graphModules = new Set([...entries, ...views])

async function rendererGraph(eager = false) {
  const eagerFile = registrations[0].filename
  const result = await build({
    root,
    configFile: false,
    publicDir: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'renderer-graph-boundaries',
        enforce: 'pre',
        resolveId(id, importer) {
          if (id.startsWith('\0')) return
          const candidate = id.startsWith('@/')
            ? resolve(root, 'apps/app/src', id.slice(2))
            : id.startsWith('.') && importer
            ? resolve(dirname(importer), id)
            : id
          if (
            graphModules.has(candidate.split('?')[0]) &&
            !candidate.includes('type=style')
          )
            return candidate
          if (!extname(candidate)) {
            for (const extension of ['.ts', '.vue']) {
              if (graphModules.has(candidate + extension))
                return candidate + extension
            }
          }
          // Compile the real target SFCs and registration cycles, but leave their
          // services, shared controls, CSS and native integrations external.
          return { id, external: true }
        },
        transform(source, id) {
          if (!eager || id !== eagerFile) return
          const lazy =
            "settingsComponent: defineAsyncComponent(() => import('./NvSettings.vue'))"
          assert.ok(
            source.includes(lazy),
            'mutation must target the existing lazy boundary',
          )
          return `import EagerSettings from './NvSettings.vue'\n${source.replace(
            lazy,
            'settingsComponent: EagerSettings',
          )}`
        },
      },
      vuePlugin(),
    ],
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        input: [...entries],
        output: { format: 'es' },
        preserveEntrySignatures: 'strict',
        onwarn(warning, warn) {
          if (warning.code !== 'CIRCULAR_DEPENDENCY') warn(warning)
        },
      },
    },
  })
  return result.output.filter((item) => item.type === 'chunk')
}

function assertLazyGraph(chunks) {
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const staticModules = new Set()
  function visit(chunk) {
    for (const id of Object.keys(chunk.modules))
      staticModules.add(id.split('?')[0])
    for (const id of chunk.imports) {
      const dependency = byName.get(id)
      if (dependency && !seen.has(id)) {
        seen.add(id)
        visit(dependency)
      }
    }
  }
  const seen = new Set()
  for (const chunk of chunks.filter((chunk) => chunk.isEntry)) visit(chunk)
  const bundledModules = new Set(
    chunks.flatMap((chunk) =>
      Object.keys(chunk.modules).map((id) => id.split('?')[0]),
    ),
  )
  const compiledScripts = new Set(
    chunks.flatMap((chunk) =>
      Object.entries(chunk.modules)
        .filter(
          ([id, module]) =>
            id.includes('?vue&type=script') && module.renderedLength > 0,
        )
        .map(([id]) => id.split('?')[0]),
    ),
  )
  assert.equal(views.size, 49, 'cover all provider and route SFCs')
  for (const view of views) {
    assert.ok(
      compiledScripts.has(view),
      `${view} must include its compiled implementation, not just a facade`,
    )
    assert.ok(
      bundledModules.has(view),
      `${view} must compile into a real chunk`,
    )
    assert.equal(
      staticModules.has(view),
      false,
      `${view} must stay outside the idle static graph`,
    )
  }
}

test('Vite compiles the real provider and route SFCs outside the idle entry graph', async () => {
  assertLazyGraph(await rendererGraph())
  // Prove the graph gate catches an accidentally restored eager import, without
  // changing source files or writing test artifacts into production output.
  const eagerChunks = await rendererGraph(true)
  assert.throws(
    () => assertLazyGraph(eagerChunks),
    /must stay outside the idle static graph/,
  )
})
