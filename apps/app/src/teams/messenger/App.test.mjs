import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as vue from 'vue'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

function windowFocusFixture(t) {
  const filename = fileURLToPath(new URL('./App.vue', import.meta.url))
  const { descriptor } = parse(readFileSync(filename, 'utf8'), {
    filename: `${filename}?window-focus`,
  })
  compileScript(descriptor, { id: filename, inlineTemplate: true })
  const source = ts.createSourceFile(
    filename,
    descriptor.scriptSetup.content,
    ts.ScriptTarget.Latest,
    true,
  )
  const watchers = source.statements.filter(
    (node) =>
      ts.isExpressionStatement(node) &&
      ts.isCallExpression(node.expression) &&
      node.expression.expression.getText(source) === 'watch' &&
      node.expression.arguments[0]
        .getText(source)
        .includes('messengerWindowStore.'),
  )
  const messengerWindowStore = vue.reactive({ isShown: true, isFocused: true })
  const document = { activeElement: null }
  class HTMLElement {
    blurCount = 0
    focus() {
      document.activeElement = this
    }
    blur() {
      this.blurCount++
      document.activeElement = null
    }
  }
  const scope = vue.effectScope()
  t.after(() => scope.stop())
  scope.run(() =>
    loadTypescript(
      filename,
      {},
      {
        watch: vue.watch,
        messengerWindowStore,
        document,
        HTMLElement,
        socket: { emit() {} },
      },
      watchers.map((node) => node.getText(source)).join('\n'),
    ),
  )
  return { messengerWindowStore, document, HTMLElement, scope }
}

test('hiding clears the active close button before reopening', async (t) => {
  const { messengerWindowStore, document, HTMLElement } = windowFocusFixture(t)
  const closeButton = new HTMLElement()
  closeButton.focus()
  messengerWindowStore.isFocused = false
  messengerWindowStore.isShown = false
  await vue.nextTick()
  assert.equal(document.activeElement, null)
  assert.equal(closeButton.blurCount, 1)
  messengerWindowStore.isShown = true
  messengerWindowStore.isFocused = true
  await vue.nextTick()
  assert.equal(document.activeElement, null)
  assert.equal(closeButton.blurCount, 1)
})

test('a same-tick hide and reopen cannot retain the previous focus', async (t) => {
  const { messengerWindowStore, document, HTMLElement } = windowFocusFixture(t)
  const closeButton = new HTMLElement()
  closeButton.focus()
  messengerWindowStore.isShown = false
  messengerWindowStore.isShown = true
  await vue.nextTick()
  assert.equal(document.activeElement, null)
  assert.equal(closeButton.blurCount, 1)
})

test('ordinary window blur and refocus retain the active element', async (t) => {
  const { messengerWindowStore, document, HTMLElement } = windowFocusFixture(t)
  const input = new HTMLElement()
  input.focus()
  messengerWindowStore.isFocused = false
  await vue.nextTick()
  assert.equal(document.activeElement, input)
  messengerWindowStore.isFocused = true
  await vue.nextTick()
  assert.equal(document.activeElement, input)
  assert.equal(input.blurCount, 0)
})

test('showing the window does not clear a newly focused element', async (t) => {
  const { messengerWindowStore, document, HTMLElement } = windowFocusFixture(t)
  messengerWindowStore.isShown = false
  await vue.nextTick()
  const input = new HTMLElement()
  input.focus()
  messengerWindowStore.isShown = true
  await vue.nextTick()
  assert.equal(document.activeElement, input)
  assert.equal(input.blurCount, 0)
})

for (const activeElement of [null, {}]) {
  test(`hiding safely ignores ${
    activeElement === null ? 'missing' : 'non-HTML'
  } active elements`, async (t) => {
    const { messengerWindowStore, document } = windowFocusFixture(t)
    document.activeElement = activeElement
    messengerWindowStore.isShown = false
    await vue.nextTick()
    assert.equal(document.activeElement, activeElement)
  })
}

test('the visibility watcher stops with its component scope', async (t) => {
  const { messengerWindowStore, document, HTMLElement, scope } =
    windowFocusFixture(t)
  const input = new HTMLElement()
  input.focus()
  scope.stop()
  messengerWindowStore.isShown = false
  await vue.nextTick()
  assert.equal(document.activeElement, input)
  assert.equal(input.blurCount, 0)
})

for (const team of ['messenger', 'overlay']) {
  test(`${team} root reactively resolves every selected ID and preserves primitive tokens`, () => {
    const filename = fileURLToPath(
      new URL(`../${team}/App.vue`, import.meta.url),
    )
    const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
    const provider = descriptor.template.ast.children.find(
      (node) => node.tag === 'ThemeProvider',
    )
    assert.ok(
      provider?.props.some(
        (prop) =>
          prop.name === 'bind' &&
          prop.arg?.content === 'theme' &&
          prop.exp?.content === 'theme',
      ),
    )
    // Compile the real SFC, then isolate its theme computation from window/IPC setup.
    compileScript(descriptor, { id: filename, inlineTemplate: true })
    const source = ts.createSourceFile(
      filename,
      descriptor.scriptSetup.content,
      ts.ScriptTarget.Latest,
      true,
    )
    const imports = source.statements.filter(
      (node) =>
        ts.isImportDeclaration(node) &&
        node.moduleSpecifier.text === '@packages/ui',
    )
    const declaration = source.statements.find(
      (node) =>
        ts.isVariableStatement(node) &&
        node.declarationList.declarations.some(
          (item) => item.name.getText(source) === 'theme',
        ),
    )
    assert.ok(declaration, 'Missing root theme computation')
    const settingsStore = vue.reactive({ theme: 'light' })
    const tokens = { spacing: { one: '4px' }, color: 'primitive' }
    const calls = []
    const ui = {
      tokens,
      themes: new Map(),
      resolveTheme(id) {
        calls.push(id)
        return { color: id, semantic: { exactName: id } }
      },
    }
    const { theme } = loadTypescript(
      filename,
      { '@packages/ui': ui },
      {
        settingsStore,
        computed: vue.computed,
      },
      `${imports
        .map((node) => node.getText(source))
        .join('\n')}\n${declaration.getText(source)}\nexport { theme }`,
    )
    const ids = [
      'light',
      'dark',
      'izabela-light',
      'custom-family-new-mode',
      'unrecognized-saved-mode',
    ]
    for (const id of ids) {
      settingsStore.theme = id
      assert.equal(theme.value.color, id)
      assert.equal(theme.value.spacing, tokens.spacing)
      assert.equal(theme.value.semantic.exactName, id)
    }
    assert.deepEqual(calls, ids)
  })
}
