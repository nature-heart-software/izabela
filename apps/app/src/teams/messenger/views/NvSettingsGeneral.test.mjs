import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as vue from 'vue'
import { renderToString } from 'vue/server-renderer'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

const filename = fileURLToPath(
  new URL('./NvSettingsGeneral.vue', import.meta.url),
)
const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
const templateAst = structuredClone(descriptor.template.ast)

async function renderSettings(disabled, savedAutoUpdate) {
  const script = compileScript(descriptor, {
    id: filename,
    inlineTemplate: true,
  })
  const layout = {
    setup:
      (_, { slots }) =>
      () =>
        vue.h('div', slots.default?.()),
  }
  const ui = Object.fromEntries(
    [
      'NvButton',
      'NvCard',
      'NvDivider',
      'NvGroup',
      'NvNumberInput',
      'NvRangeInput',
      'NvSelect',
      'NvStack',
      'NvText',
    ].map((name) => [name, layout]),
  )
  ui.NvSwitch = {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup:
      (props, { emit }) =>
      () =>
        vue.h('span', {
          'data-switch': '',
          'data-model-value': String(props.modelValue),
          tabindex: 0,
          onClick: () => emit('update:modelValue', !props.modelValue),
        }),
  }
  const patches = []
  const settingsStore = {
    enableAutoUpdate: savedAutoUpdate,
    updateChannel: 'beta',
    keybindings: {},
    $patch: (value) => {
      patches.push(value)
      Object.assign(settingsStore, value)
    },
  }
  const component = loadTypescript(
    filename,
    {
      vue,
      '@packages/ui': ui,
      '@/features/settings/store': {
        useSettingsStore: () => settingsStore,
      },
      '@/features/display/components/inputs/DisplaySelect.vue': layout,
      '@/features/app/components/inputs/NvKeybinding.vue': layout,
      '@/features/update/components/inputs/NvUpdateChannelSelect.vue': {
        setup: () => () => vue.h('span', 'update-channel-select'),
      },
      '@/hooks/use-confirm-admin.ts': { useConfirmAdmin: () => () => {} },
      '@/features/app/queries.ts': {
        useClearCacheMutation: () => ({ reset: vue.ref(() => {}) }),
      },
      '@/teams/messenger/store': { useMessengerStateStore: () => ({}) },
    },
    {
      __importMetaEnv: { VITE_DISABLE_AUTO_UPDATE: disabled },
      window: { setTimeout },
    },
    script.content,
  ).default
  const html = await renderToString(vue.createSSRApp(component))
  const updateSection = html.slice(
    html.indexOf('Enable auto-update'),
    html.indexOf('Cache'),
  )
  assert.match(updateSection, /Enable auto-update/)
  const invokeUpdate = (property, value) => {
    const findControl = (node) => {
      if (
        node.props?.some(
          (prop) =>
            prop.name === 'bind' &&
            prop.arg?.content === 'modelValue' &&
            prop.exp?.content === `settingsStore.${property}`,
        )
      ) {
        return node
      }
      return node.children?.map(findControl).find(Boolean)
    }
    const control = findControl(templateAst)
    const handler = control?.props.find(
      (prop) => prop.name === 'on' && prop.arg?.content === 'update:modelValue',
    )?.exp.content
    assert.ok(handler, `Missing update handler for ${property}`)
    // Exercise the actual SFC handler even when its control is not rendered.
    loadTypescript(
      filename,
      {},
      { settingsStore, autoUpdateDisabled: disabled === 'true' },
      `export default (${handler})`,
    ).default(value)
  }
  return { html, updateSection, patches, settingsStore, invokeUpdate }
}

for (const savedAutoUpdate of [false, true]) {
  test(`artifact settings omit the update switch and channel, preserving saved ${savedAutoUpdate}`, async () => {
    const { html, updateSection, patches, settingsStore } =
      await renderSettings('true', savedAutoUpdate)
    assert.doesNotMatch(updateSection, /data-switch/)
    assert.match(updateSection, /Updates are disabled for this build\./)
    assert.doesNotMatch(html, /update-channel-select/)
    assert.equal(settingsStore.enableAutoUpdate, savedAutoUpdate)
    assert.equal(settingsStore.updateChannel, 'beta')
    assert.deepEqual(patches, [])
  })

  test(`artifact update handlers cannot overwrite saved ${savedAutoUpdate}`, async () => {
    const { invokeUpdate, settingsStore, patches } = await renderSettings(
      'true',
      savedAutoUpdate,
    )
    invokeUpdate('enableAutoUpdate', !savedAutoUpdate)
    invokeUpdate('updateChannel', 'alpha')
    assert.deepEqual(patches, [])
    assert.equal(settingsStore.enableAutoUpdate, savedAutoUpdate)
    assert.equal(settingsStore.updateChannel, 'beta')
  })

  test(`ordinary update handlers can change saved ${savedAutoUpdate}`, async () => {
    const { invokeUpdate, settingsStore, patches } = await renderSettings(
      undefined,
      savedAutoUpdate,
    )
    invokeUpdate('enableAutoUpdate', !savedAutoUpdate)
    invokeUpdate('updateChannel', 'alpha')
    assert.equal(patches.length, 2)
    assert.equal(patches[0].enableAutoUpdate, !savedAutoUpdate)
    assert.equal(patches[1].updateChannel, 'alpha')
    assert.equal(settingsStore.enableAutoUpdate, !savedAutoUpdate)
    assert.equal(settingsStore.updateChannel, 'alpha')
  })

  test(`ordinary settings retain the update switch and saved ${savedAutoUpdate}`, async () => {
    const { html, updateSection, patches, settingsStore } =
      await renderSettings(undefined, savedAutoUpdate)
    assert.match(updateSection, /data-switch/)
    assert.match(
      updateSection,
      new RegExp(`data-model-value="${savedAutoUpdate}"`),
    )
    assert.doesNotMatch(html, /Updates are disabled for this build\./)
    assert.equal(html.includes('update-channel-select'), savedAutoUpdate)
    assert.equal(settingsStore.enableAutoUpdate, savedAutoUpdate)
    assert.deepEqual(patches, [])
  })
}
