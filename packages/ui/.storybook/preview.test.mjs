import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import * as vue from 'vue'
import loadTypescript from '../../../tests/load-typescript.cjs'

const filename = fileURLToPath(new URL('./preview.js', import.meta.url))

function loadPreview(themeOptions, vueApi = vue, extraThemes = {}, ui = {}) {
  return loadTypescript(filename, {
    '@/styles': {},
    '@/themes': { themeOptions, themes: new Map(), ...extraThemes },
    '@/main': { GlobalStyles: {}, ...ui },
    vue: vueApi,
  })
}

test('theme toolbar exposes any imported mode inventory with exact labels and IDs', () => {
  for (const count of [1, 3, 17]) {
    const themeOptions = Array.from({ length: count }, (_, index) => ({
      label: `Custom Theme ${index} / Mode ${index}`,
      value: `custom-theme-${index}-mode-${index}`,
    }))
    const preview = loadPreview(themeOptions)
    assert.ok(preview.globalTypes?.theme, 'Missing theme toolbar')
    assert.deepEqual(
      Array.from(preview.globalTypes.theme.toolbar.items, (item) => ({
        value: item.value,
        title: item.title,
      })),
      themeOptions.map(({ value, label }) => ({ value, title: label })),
    )
    assert.equal(preview.globalTypes.theme.defaultValue, 'dark')
  }
})

test('changing globals updates the already-mounted story through the theme resolver', async () => {
  const providerFile = fileURLToPath(
    new URL('../src/themes/provider.ts', import.meta.url),
  )
  const { ThemeProvider } = loadTypescript(providerFile, { vue })
  const modes = new Map([
    ['dark', { semantic: { name: 'Izabela Dark' }, darkOnly: true }],
    ['light', { semantic: { name: 'Izabela Light' } }],
    [
      'custom-theme-new-mode',
      { semantic: { name: 'Custom Theme / New Mode' } },
    ],
  ])
  const calls = []
  const GlobalStyles = {
    setup:
      (_, { slots }) =>
      () =>
        slots.default?.(),
  }
  const preview = loadPreview(
    [],
    vue,
    {
      themes: modes,
      resolveTheme(id) {
        calls.push(id)
        return modes.get(id) ?? modes.get('dark')
      },
    },
    { ThemeProvider, GlobalStyles },
  )
  let injectedTheme
  const Story = {
    setup() {
      injectedTheme = vue.inject('theme')
      return () => vue.h('span')
    },
  }
  const renderer = vue.createRenderer({
    createElement: (tag) => ({ tag, children: [] }),
    createText: (text) => ({ text }),
    createComment: (text) => ({ text }),
    insert(node, parent, anchor = null) {
      node.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(
        index < 0 ? parent.children.length : index,
        0,
        node,
      )
    },
    remove(node) {
      const siblings = node.parent.children
      siblings.splice(siblings.indexOf(node), 1)
      node.parent = null
    },
    setText(node, text) {
      node.text = text
    },
    setElementText(node, text) {
      node.text = text
    },
    patchProp(node, key, previous, value) {
      node[key] = value
    },
    parentNode: (node) => node.parent,
    nextSibling: (node) =>
      node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
  })
  const decorator = preview.decorators[0]
  const app = renderer.createApp(decorator(Story, { globals: {} }))
  app.mount({ children: [] })
  try {
    assert.equal(injectedTheme?.semantic.name, 'Izabela Dark')
    for (const id of [
      'light',
      'custom-theme-new-mode',
      'unknown-persisted-mode',
      'dark',
    ]) {
      // Storybook can rerun decorators while retaining the current Vue app.
      decorator(Story, { globals: { theme: id } })
      await vue.nextTick()
      assert.deepEqual(
        JSON.parse(JSON.stringify(injectedTheme)),
        modes.get(id) ?? modes.get('dark'),
      )
      assert.equal(calls.at(-1), id)
    }
  } finally {
    app.unmount()
  }
})
