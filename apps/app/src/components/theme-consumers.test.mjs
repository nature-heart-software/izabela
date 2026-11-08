import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test, { after } from 'node:test'
import { parse, compileStyle, compileScript } from '@vue/compiler-sfc'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
const globals = [
  'window',
  'document',
  'Element',
  'HTMLElement',
  'SVGElement',
  'Node',
]
const previousGlobals = new Map(
  globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
)
for (const key of globals)
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: dom.window[key],
  })
const vue = await import('vue')
after(() => {
  dom.window.close()
  for (const key of globals) {
    const previous = previousGlobals.get(key)
    if (previous) Object.defineProperty(globalThis, key, previous)
    else delete globalThis[key]
  }
})
import loadTypescript from '../../../../tests/load-typescript.cjs'

const filename = fileURLToPath(new URL('./index.ts', import.meta.url))
const templates = []
loadTypescript(filename, {
  'vue3-styled-components':
    () =>
    (strings, ...values) => {
      templates.push((theme) =>
        strings.reduce(
          (css, part, index) =>
            css +
            part +
            (index < values.length ? values[index]({ theme }) : ''),
          '',
        ),
      )
    },
})

test('audio and history bars consume exact horizontal divider and plain button roles', () => {
  const theme = {
    divider: { horizontal: { border: '#123456' } },
    button: { plain: { background: '#abcdef' } },
  }
  assert.match(templates[0](theme), /background-color: #123456;/)
  assert.match(templates[1](theme), /background-color: #abcdef;/)
})

function overlayStyles() {
  const url = new URL(
    '../teams/overlay/components/NvOverlayInput.vue',
    import.meta.url,
  )
  const source = readFileSync(url, 'utf8')
  const { descriptor } = parse(source)
  const declaration = descriptor.scriptSetup.content.match(
    /const NvInput = styled\('div'(?:, \{\})?\)`[\s\S]*?`/,
  )[0]
  let render
  loadTypescript(
    fileURLToPath(url),
    {
      'vue3-styled-components':
        () =>
        (strings, ...values) => {
          render = (theme) =>
            strings.reduce(
              (css, part, index) =>
                css +
                part +
                (index < values.length ? values[index]({ theme }) : ''),
              '',
            )
        },
    },
    {},
    `import styled from 'vue3-styled-components'\n${declaration}`,
  )
  const compiled = compileStyle({
    source: descriptor.styles[0].content,
    filename: fileURLToPath(url),
    id: 'overlay-input',
    scoped: true,
    preprocessLang: 'scss',
  })
  assert.deepEqual(compiled.errors, [])
  return { source, render, css: compiled.code }
}

test('overlay input consumes authored text, border, caret, selection and placeholder roles', () => {
  const styles = overlayStyles()
  const theme = { input: { default: { text: '#123456', border: '#234567' } } }
  const css = styles.render(theme)
  assert.match(css, /color: #123456;/)
  assert.match(css, /border-color: #234567;/)
  assert.match(css, /background-color: #123456;/)
  assert.match(styles.source, /borderColor: 'input.default.border'/)
  assert.match(
    styles.css,
    /background-color: var\(--nv-option-default-selected-background\)/,
  )
  assert.match(styles.css, /color: var\(--nv-option-default-selected-text\)/)
  assert.match(styles.css, /color: var\(--nv-input-default-placeholder\)/)
  assert.match(
    styles.css,
    /background-color: var\(--nv-theme-background-transparent\)/,
  )
})

test('recording indicator uses loading semantics and supplies the selected theme in its separate renderer', () => {
  const source = readFileSync(
    new URL(
      '../teams/speech-worker/components/NvSpeechRecordingLogo.vue',
      import.meta.url,
    ),
    'utf8',
  )
  assert.match(source, /backgroundColor: 'loading.default.pending.background'/)
  assert.match(
    source,
    /border: '8px solid \{colors.loading.default.pending.spinner\}'/,
  )
  assert.match(source, /backgroundColor: 'loading.default.pending.spinner'/)
  assert.match(source, /<ThemeProvider :theme="theme">/)
  assert.match(source, /resolveTheme\(settingsStore.theme\)/)
  assert.doesNotMatch(source, /#[0-9a-f]{3,8}|gray\.0/i)
})

test('messenger backdrop and diagnostic outlines use their semantic colors without changing user opacity or geometry', () => {
  const background = readFileSync(
    new URL('../teams/messenger/components/NvBackground.vue', import.meta.url),
    'utf8',
  )
  const debug = readFileSync(
    new URL('../teams/messenger/components/NvDebug.vue', import.meta.url),
    'utf8',
  )
  assert.match(background, /backgroundColor: 'dialog.default.backdrop'/)
  assert.match(background, /opacity: settingsStore.backgroundDimOpacity \/ 100/)
  assert.match(debug, /border: '1px solid \{colors.debug.hitbox.border\}'/)
  assert.match(debug, /width: rem\(hitbox.w \/ pixelRatio\)/)
  assert.doesNotMatch(debug, /solid red/)
})

const repo = new URL('../../../../', import.meta.url)
const imported = JSON.parse(
  readFileSync(
    new URL('packages/design-tokens/src/figma.generated.json', repo),
    'utf8',
  ),
)
const { ThemeProvider } = loadTypescript(
  fileURLToPath(new URL('packages/ui/src/themes/provider.ts', repo)),
  { vue },
)
const { pandaComponent, themeVariables } = loadTypescript(
  fileURLToPath(new URL('packages/ui/src/utils/panda.ts', repo)),
  { vue },
)
const valueAt = (theme, path) =>
  path.split('.').reduce((value, key) => value[key], theme)

test('hitbox debug borders stay pure red in every imported theme', () => {
  for (const mode of imported.themes) {
    assert.equal(mode.values.debug.hitbox.border, '#ff0000', mode.label)
  }
})

test('every app-owned color reference is an existing imported semantic path', () => {
  const root = new URL('../', import.meta.url)
  const files = readdirSync(root, { recursive: true })
    .map((name) => name.replaceAll('\\', '/'))
    .filter(
      (name) =>
        /\.(vue|ts|scss|css)$/.test(name) &&
        !name.startsWith('styled-system/') &&
        !name.endsWith('/App.vue') &&
        name !== 'features/settings/store/index.ts' &&
        name !== 'teams/messenger/views/NvSettingsGeneral.vue',
    )
  const cssNames = new Set()
  function visit(tree, path = []) {
    for (const [key, value] of Object.entries(tree)) {
      if (Object.hasOwn(value, 'value')) {
        cssNames.add(
          `--nv-${[...path, key]
            .join('-')
            .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        )
      } else visit(value, [...path, key])
    }
  }
  visit(imported.semanticTokens.colors)
  assert.ok(
    files.length > 200,
    'inventory must cover the actual app source tree',
  )
  for (const name of files) {
    const source = readFileSync(new URL(name, root), 'utf8')
    for (const [, cssName] of source.matchAll(/var\((--nv-[\w-]+)/g)) {
      assert.ok(
        cssNames.has(cssName),
        `${name}: unknown semantic variable ${cssName}`,
      )
    }
    for (const [, path] of source.matchAll(/\{colors\.([^}]+)\}/g)) {
      assert.ok(
        valueAt(imported.semanticTokens.colors, path),
        `${name}: unknown composite ${path}`,
      )
    }
    assert.doesNotMatch(
      source,
      /theme\.(?:text\.color|input\.(?:color|borderColor)|divider\.borderColor|button\.[\w-]+\.backgroundColor)/,
      name,
    )
    assert.doesNotMatch(source, /lighten\(/, name)
    assert.doesNotMatch(
      source,
      /(?:color|backgroundColor|borderColor):\s*['"](?:#[\da-f]{3,8}|gray\.\d+|black|white)['"]/i,
      name,
    )
  }
})

for (const mode of imported.themes) {
  test(`app bar, overlay selection and caret styles resolve imported ${mode.label} without aliases`, () => {
    const { values } = mode
    const styles = overlayStyles()
    assert.ok(templates[0](values).includes(values.divider.horizontal.border))
    assert.ok(templates[1](values).includes(values.button.plain.background))
    const overlay = styles.render(values)
    assert.ok(overlay.includes(values.input.default.text))
    assert.ok(overlay.includes(values.input.default.border))
    assert.doesNotMatch(overlay, /undefined/)
    const variables = themeVariables(values)
    const resolved = styles.css.replace(/var\((--nv-[\w-]+)\)/g, (_, name) => {
      assert.ok(Object.hasOwn(variables, name), `${mode.id}: missing ${name}`)
      return variables[name]
    })
    assert.ok(resolved.includes(values.option.default.selected.background))
    assert.ok(resolved.includes(values.option.default.selected.text))
    assert.ok(resolved.includes(values.input.default.placeholder))
    assert.doesNotMatch(resolved, /var\(--nv-/)
  })
}

async function mountRecording(t, sourceTransform = (source) => source) {
  const url = new URL(
    '../teams/speech-worker/components/NvSpeechRecordingLogo.vue',
    import.meta.url,
  )
  const filename = fileURLToPath(url)
  const { descriptor } = parse(sourceTransform(readFileSync(url, 'utf8')), {
    filename,
  })
  const script = compileScript(descriptor, {
    id: filename,
    inlineTemplate: true,
  })
  const settings = vue.reactive({ theme: imported.themes[0].id })
  const recipes = []
  const component = loadTypescript(
    filename,
    {
      vue,
      '@packages/ui': {
        ThemeProvider,
        GlobalStyles: pandaComponent('div'),
        resolveTheme: (id) =>
          imported.themes.find((mode) => mode.id === id).values,
      },
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/styled-system/css': {
        css: (styles) => {
          recipes.push(styles)
          return `app-source-${recipes.length - 1}`
        },
      },
    },
    {},
    script.content,
  ).default
  const root = document.createElement('div')
  document.body.append(root)
  const app = vue.createApp(component)
  t.after(() => {
    app.unmount()
    root.remove()
  })
  app.mount(root)
  return { root, settings, recipes }
}

function descendants(node) {
  return [node, ...Array.from(node.children ?? []).flatMap(descendants)]
}

function assertRecordingColors(fixture, mode) {
  const nodes = descendants(fixture.root)
  const surface = nodes.find((node) =>
    node.classList?.contains('animation-wrapper'),
  )
  assert.ok(surface, 'recording surface is rendered')
  const spinner = mode.values.loading.default.pending.spinner
  const background = mode.values.loading.default.pending.background
  assert.equal(
    surface.style.getPropertyValue('--nv-loading-default-pending-spinner'),
    spinner,
  )
  assert.equal(
    surface.style.getPropertyValue('--nv-loading-default-pending-background'),
    background,
  )
  for (const node of nodes) {
    for (const match of (node.getAttribute?.('class') ?? '').matchAll(
      /app-source-(\d+)/g,
    )) {
      const recipe = fixture.recipes[Number(match[1])]
      if (recipe.backgroundColor) {
        assert.equal(
          valueAt(mode.values, recipe.backgroundColor),
          node === surface ? background : spinner,
        )
      }
      if (recipe.border) {
        assert.equal(
          recipe.border.replace(/\{colors\.([^}]+)\}/g, (_, path) =>
            valueAt(mode.values, path),
          ),
          `8px solid ${spinner}`,
        )
      }
    }
  }
  return surface
}

test('recording SFC and real theme injection switch every imported mode without remounting', async (t) => {
  const fixture = await mountRecording(t)
  let original
  for (const mode of imported.themes) {
    fixture.settings.theme = mode.id
    await vue.nextTick()
    const surface = assertRecordingColors(fixture, mode)
    original ??= surface
    assert.equal(surface, original)
  }
})

test('recording source seam detects removal of its theme provider', async (t) => {
  const fixture = await mountRecording(t, (source) =>
    source
      .replace('<ThemeProvider :theme="theme">', '<div>')
      .replace('</ThemeProvider>', '</div>'),
  )
  assert.throws(
    () => assertRecordingColors(fixture, imported.themes[0]),
    /Expected values to be strictly equal/,
  )
})
