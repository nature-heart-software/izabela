import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test, { afterEach } from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'

const root = new URL('../../../../', import.meta.url)
const layout = {
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.()),
}
const ui = Object.fromEntries(
  ['NvButton', 'NvCard', 'NvDivider', 'NvGroup', 'NvStack', 'NvText'].map(
    (name) => [name, layout],
  ),
)

function loadVue(url, mocks) {
  const filename = fileURLToPath(url)
  const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
  const script = compileScript(descriptor, {
    id: filename,
    inlineTemplate: true,
  })
  return loadTypescript(filename, mocks, {}, script.content).default
}

async function renderSettings({
  supported = true,
  authenticated = true,
  local = false,
} = {}) {
  const engine = {
    id: 'provider',
    name: 'Provider',
    getRegions: supported ? async () => [] : undefined,
    settingsComponent: layout,
    store: { getProperty: (key) => key === 'useLocalCredentials' && local },
  }
  const mocks = {
    '@packages/ui': ui,
    '@/features/speech/components/inputs/NvSpeechEngineSelect.vue': layout,
    '@/features/speech/components/forms/NvUniversalApiForm.vue': layout,
    '@/features/speech/components/inputs/NvSpeechRegionSelect.vue': {
      setup: () => () => h('select', { 'aria-label': 'Region' }),
    },
    '@/modules/speech-engine-manager': { getEngines: () => [engine] },
    '@/features/settings/store': { useSettingsStore: () => ({}) },
    '@/features/speech/store': {
      useSpeechStore: () => ({
        selectedSpeechEngine: engine.id,
        hasUniversalApiCredentials: authenticated,
      }),
    },
  }
  const component = loadVue(
    new URL('teams/messenger/views/NvSettingsEngine.vue', root),
    mocks,
  )
  return renderToString(createSSRApp(component))
}

const mountedApps = []
afterEach(() => mountedApps.splice(0).forEach((app) => app.unmount()))
const renderer = createRenderer({
  createElement: (tag) => ({ tag, props: {}, children: [] }),
  createText: (text) => ({ text }),
  createComment: () => ({}),
  setText: (node, text) => {
    node.text = text
  },
  setElementText: (node, text) => {
    node.text = text
  },
  patchProp: (node, key, _, value) => {
    node.props[key] = value
  },
  insert(node, parent, anchor) {
    node.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
  },
  remove(node) {
    const children = node.parent?.children
    if (children) children.splice(children.indexOf(node), 1)
  },
  parentNode: (node) => node.parent,
  nextSibling: () => null,
})
const textContent = (node) =>
  [node.text || '', ...(node.children || []).map(textContent)].join(' ')

async function renderRegion(getRegions, selectedRegion = '') {
  const updates = []
  let select
  const component = loadVue(
    new URL('./NvSpeechRegionSelect.vue', import.meta.url),
    {
      '@packages/ui': {
        ...ui,
        NvSelect: {
          props: ['modelValue', 'options'],
          setup(props, { attrs }) {
            select = { props, update: attrs['onUpdate:modelValue'] }
            return () =>
              h(
                'select',
                { value: props.modelValue },
                props.options.map(({ label, value }) =>
                  h('option', { value }, label),
                ),
              )
          },
        },
      },
      '@/features/settings/store': {
        useSettingsStore: () => ({
          universalApiEndpoint: 'https://api.example.test',
          universalApiKey: 'test-key',
        }),
      },
    },
  )
  const host = { children: [] }
  const app = renderer.createApp(component, {
    engine: {
      getRegions,
      store: {
        getProperty: () => selectedRegion,
        setProperty: (key, value) => updates.push({ key, value }),
      },
    },
  })
  app.mount(host)
  mountedApps.push(app)
  await new Promise(setImmediate)
  return { html: textContent(host), select, updates }
}

test('region choices use server labels and default to Auto without storing a selection', async () => {
  const { html, select, updates } = await renderRegion(async () => [
    { name: 'Auto', value: 'auto' },
    { name: 'London', value: 'eu-west-2' },
  ])
  assert.match(html, /Region/)
  assert.match(html, /London/)
  assert.equal(select.props.modelValue, 'auto')
  assert.equal(
    select.props.options.filter(({ value }) => value === 'auto').length,
    1,
  )
  assert.deepEqual(updates, [])
})

test('selecting a region persists per provider and Auto clears the optional field', async () => {
  const { select, updates } = await renderRegion(async () => [])
  select.update('eu-west-2')
  select.update('auto')
  assert.deepEqual(updates, [
    { key: 'remoteRegion', value: 'eu-west-2' },
    { key: 'remoteRegion', value: '' },
  ])
})

test('an unavailable optional catalog preserves the saved choice and allows Auto', async () => {
  const { html, select } = await renderRegion(async () => {
    throw new Error('404')
  }, 'eu-west-2')
  assert.match(html, /Regions could not be loaded/)
  assert.equal(select.props.modelValue, 'eu-west-2')
  assert.ok(select.props.options.some(({ value }) => value === 'auto'))
  assert.ok(select.props.options.some(({ value }) => value === 'eu-west-2'))
})

test('an empty optional catalog still offers Auto', async () => {
  const { select } = await renderRegion(async () => [])
  assert.equal(select.props.options.length, 1)
  assert.equal(select.props.options[0].value, 'auto')
})

test('provider settings expose the optional remote region selector', async () => {
  assert.match(await renderSettings(), /aria-label="Region"/)
})

test('region selection is absent for unsupported providers and local credentials', async () => {
  for (const options of [
    { supported: false },
    { authenticated: false },
    { local: true },
  ]) {
    assert.doesNotMatch(await renderSettings(options), /aria-label="Region"/)
  }
})
