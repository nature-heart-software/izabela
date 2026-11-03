import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

test('persisted theme accepts arbitrary mode IDs while retaining the legacy light default', () => {
  const filename = fileURLToPath(new URL('./index.ts', import.meta.url))
  const source = ts.createSourceFile(
    filename,
    readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  let declaration
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === 'theme'
    ) {
      declaration = node.getText(source)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(declaration, 'Missing persisted theme declaration')
  const probe = `${filename}.theme-probe.ts`
  const text = `import { ref } from 'vue'\nconst ${declaration}\ntheme.value = 'custom-family-custom-mode'\n`
  const options = {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    types: [],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  }
  const host = ts.createCompilerHost(options)
  const getSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (name, ...args) =>
    name === probe
      ? ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true)
      : getSourceFile(name, ...args)
  const program = ts.createProgram([probe], options, host)
  const diagnostics = ts.getPreEmitDiagnostics(program)
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    }),
  )
  const initializer = declaration.slice(declaration.indexOf('=') + 1)
  assert.match(initializer, /\('light'\)/)
})
