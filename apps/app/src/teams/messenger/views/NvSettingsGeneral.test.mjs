import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as vue from 'vue'
import { renderToString } from 'vue/server-renderer'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'
import ts from 'typescript'
import flatten from 'lodash/flatten.js'
import get from 'lodash/get.js'
import { compileVariables } from '../../../../../../packages/design-tokens/tools/figma-import.mjs'

const registryFile = fileURLToPath(
  new URL('../../../../../../packages/ui/src/themes/index.ts', import.meta.url),
)
const generated = JSON.parse(
  readFileSync(
    new URL(
      '../../../../../../packages/design-tokens/src/figma.generated.json',
      import.meta.url,
    ),
    'utf8',
  ),
)
const selectFile = fileURLToPath(
  new URL(
    '../../../../../../packages/ui/src/components/forms/Select/NvSelect.vue',
    import.meta.url,
  ),
)
const selectScript = ts.createSourceFile(
  selectFile,
  parse(readFileSync(selectFile, 'utf8')).descriptor.scriptSetup.content,
  ts.ScriptTarget.Latest,
  true,
)
const selectComputations = new Set([
  'selectedValues',
  'options',
  'selectedOptions',
  'inputValue',
])
// Execute the control's actual equality and display computations, without loading its overlay/recipe graph.
const selectSource = selectScript.statements
  .filter(
    (node) =>
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some((declaration) =>
        selectComputations.has(declaration.name.getText(selectScript)),
      ),
  )
  .map((node) => node.getText(selectScript))
  .join('\n')
assert.ok(
  [...selectComputations].every((name) =>
    selectSource.includes(`const ${name}`),
  ),
)

const filename = fileURLToPath(
  new URL('./NvSettingsGeneral.vue', import.meta.url),
)
const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
const templateAst = structuredClone(descriptor.template.ast)

async function renderSettings(disabled, savedAutoUpdate, initial = {}) {
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
  const selects = []
  const selectedStates = []
  const inventory =
    initial.inventory ??
    (initial.themeOptions
      ? {
          ...generated,
          defaultThemeId: initial.themeOptions[0].value,
          themes: initial.themeOptions.map(({ value: id, label }) => ({
            id,
            label,
            values: {},
          })),
        }
      : generated)
  const registry = loadTypescript(registryFile, {
    '../../../design-tokens/src/figma.generated.json': inventory,
  })
  Object.assign(ui, registry)
  ui.NvSelect = {
    props: {
      modelValue: String,
      options: Array,
      multiple: Boolean,
      valueKey: { default: '' },
    },
    setup(props) {
      selects.push(props)
      const state = loadTypescript(
        selectFile,
        {},
        {
          computed: vue.computed,
          props,
          flatten,
          get,
          uuid: () => 'option-id',
          hasFocus: vue.ref(false),
          isAutocompleteVisible: vue.ref(false),
          search: vue.ref(''),
        },
        `${selectSource}\nexport { selectedOptions, inputValue }`,
      )
      selectedStates.push(state)
      return () =>
        vue.h('input', {
          'data-theme-select': '',
          value: state.inputValue.value,
        })
    },
  }
  const patches = []
  const restartWrites = []
  const messengerStateStore = new Proxy(
    {
      markForRestart: initial.markForRestart ?? false,
      $patch(value) {
        Object.assign(messengerStateStore, value)
      },
    },
    {
      set(target, key, value) {
        restartWrites.push({ key, value })
        target[key] = value
        return true
      },
    },
  )
  const settingsStore = {
    theme: initial.theme ?? 'light',
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
      '@/styled-system/css': { css: () => '' },
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
      '@/teams/messenger/store': {
        useMessengerStateStore: () => messengerStateStore,
      },
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
            (prop.exp?.content === `settingsStore.${property}` ||
              (property === 'theme' &&
                prop.exp?.content === 'resolveThemeId(settingsStore.theme)')),
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
      {
        settingsStore,
        messengerStateStore,
        autoUpdateDisabled: disabled === 'true',
      },
      `export default (${handler})`,
    ).default(value)
  }
  return {
    html,
    updateSection,
    patches,
    settingsStore,
    invokeUpdate,
    messengerStateStore,
    restartWrites,
    selects,
    selectedStates,
  }
}

for (const [saved, expectedId] of [
  [undefined, 'izabela-light'],
  ['light', 'izabela-light'],
  ['dark', 'izabela-dark'],
  ['kumo-ink-light', 'kumo-light'],
  ['kumo-ink-dark', 'kumo-dark'],
  ['removed-theme', generated.defaultThemeId],
  ...generated.themes.map(({ id }) => [id, id]),
]) {
  test(`theme ${
    saved ?? '(fresh default)'
  } displays and selects its canonical imported option without store writes`, async () => {
    const result = await renderSettings(undefined, true, {
      theme: saved,
      markForRestart: true,
    })
    const expected = generated.themes.find(({ id }) => id === expectedId)
    const state = result.selectedStates[0]
    assert.equal(state.inputValue.value, expected.label)
    assert.deepEqual(
      Array.from(state.selectedOptions.value, ({ value }) => value),
      [expectedId],
    )
    assert.ok(result.html.includes(`value="${expected.label}"`))
    assert.equal(result.selects[0].modelValue, expectedId)
    assert.equal(result.settingsStore.theme, saved ?? 'light')
    assert.deepEqual(result.patches, [])
    assert.deepEqual(result.restartWrites, [])
    assert.equal(result.messengerStateStore.markForRestart, true)
    assert.deepEqual(
      Array.from(result.selects[0].options, ({ value }) => value),
      generated.themes.map(({ id }) => id),
    )
  })
}

test('future canonical Light/Dark modes remain selected through the actual settings binding', async () => {
  const snapshot = JSON.parse(
    readFileSync(
      new URL(
        '../../../../../../packages/design-tokens/figma/variables.json',
        import.meta.url,
      ),
      'utf8',
    ),
  )
  const semantic = snapshot.collections.find(
    ({ name }) => name === 'Semantic Tokens',
  )
  for (const name of ['Light', 'Dark']) {
    const from = semantic.modes.find(
      (mode) => mode.name === `GitHub ${name}`,
    ).modeId
    const modeId = `future-${name.toLowerCase()}`
    semantic.modes.push({ modeId, name })
    for (const variable of snapshot.variables.filter(
      ({ variableCollectionId }) => variableCollectionId === semantic.id,
    )) {
      variable.valuesByMode[modeId] = structuredClone(
        variable.valuesByMode[from],
      )
    }
  }
  const inventory = compileVariables(snapshot, snapshot)
  for (const id of ['light', 'dark']) {
    const result = await renderSettings(undefined, true, {
      theme: 'github-light',
      inventory,
      markForRestart: true,
    })
    result.invokeUpdate('theme', id)
    assert.equal(result.settingsStore.theme, id)
    const selected = await renderSettings(undefined, true, {
      theme: result.settingsStore.theme,
      inventory,
      markForRestart: true,
    })
    const expected = inventory.themes.find((theme) => theme.id === id)
    assert.equal(selected.selects[0].modelValue, id)
    assert.equal(selected.selectedStates[0].inputValue.value, expected.label)
    assert.deepEqual(
      Array.from(
        selected.selectedStates[0].selectedOptions.value,
        ({ value }) => value,
      ),
      [id],
    )
    assert.ok(selected.html.includes(`value="${expected.label}"`))
    assert.deepEqual(
      result.patches.map((patch) => ({ ...patch })),
      [{ theme: id }],
    )
    assert.deepEqual(selected.patches, [])
    assert.deepEqual(result.restartWrites, [])
    assert.deepEqual(selected.restartWrites, [])
    assert.equal(selected.messengerStateStore.markForRestart, true)
  }
})

for (const count of [1, 3, 17]) {
  test(`theme select exposes all ${count} imported modes with exact labels and IDs`, async () => {
    const themeOptions = Array.from({ length: count }, (_, index) => ({
      label: `Custom Theme ${index} / Mode ${index}`,
      value: `custom-theme-${index}-mode-${index}`,
    }))
    const theme = themeOptions.at(-1).value
    const result = await renderSettings(undefined, true, {
      theme,
      themeOptions,
    })
    assert.equal(result.selects.length, 1)
    assert.deepEqual(
      Array.from(result.selects[0].options, (option) => ({ ...option })),
      themeOptions,
    )
    assert.equal(result.selects[0].modelValue, theme)
    assert.equal(
      result.selectedStates[0].inputValue.value,
      themeOptions.at(-1).label,
    )
    assert.equal(result.selectedStates[0].selectedOptions.value[0].value, theme)
    result.invokeUpdate('theme', themeOptions[0].value)
    assert.equal(result.settingsStore.theme, themeOptions[0].value)
    assert.deepEqual(result.restartWrites, [])
  })
}

for (const markForRestart of [false, true]) {
  for (const [from, to] of [
    ['light', 'dark'],
    ['dark', 'light'],
  ]) {
    test(`theme handler ${from} → ${to} preserves pending restart ${markForRestart} without writes`, async () => {
      const result = await renderSettings(undefined, true, {
        theme: from,
        markForRestart,
      })
      result.invokeUpdate('theme', to)
      assert.equal(result.settingsStore.theme, to)
      assert.deepEqual(
        result.patches.map((patch) => ({ ...patch })),
        [{ theme: to }],
      )
      assert.deepEqual(result.restartWrites, [])
      assert.equal(result.messengerStateStore.markForRestart, markForRestart)
    })
  }
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
