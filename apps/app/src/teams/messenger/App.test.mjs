import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as vue from 'vue'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

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
