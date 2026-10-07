'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const polished = require('polished')
const root = fs.realpathSync(path.resolve(__dirname, '..'))
const tokenSource = 'packages/design-tokens/src/main.ts'
const adapterSource = 'packages/ui/src/styles/tokens.ts'
const helperSource = 'packages/ui/src/utils/css-in-js.ts'
const trustedModules = new Set([
  tokenSource,
  adapterSource,
  helperSource,
  'packages/ui/src/themes/light.ts',
  'packages/ui/src/themes/dark.ts',
])
const cache = new Map()
function regularFile(relative) {
  const filename = path.resolve(root, relative)
  const within = (target) => target.startsWith(root + path.sep)
  assert.ok(within(filename), `Repository containment: ${relative}`)
  assert.ok(
    fs.existsSync(filename) && fs.lstatSync(filename).isFile(),
    `Expected regular file: ${relative}`,
  )
  assert.ok(
    within(fs.realpathSync(filename)),
    `Realpath containment: ${relative}`,
  )
  return filename
}
function parse(relative) {
  const filename = regularFile(relative)
  const source = fs.readFileSync(filename, 'utf8')
  const ast = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  assert.equal(
    ast.parseDiagnostics.length,
    0,
    `TypeScript syntax in ${relative}: ${ast.parseDiagnostics
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
      .join('; ')}`,
  )
  return ast
}
// Execute only trusted checkout code. VM/restricted require are NOT a sandbox.
function load(relative) {
  assert.ok(
    trustedModules.has(relative),
    `Unexpected trusted module: ${relative}`,
  )
  const filename = regularFile(relative)
  assert.equal(
    fs.realpathSync(filename),
    filename,
    `Trusted module realpath mismatch: ${relative}`,
  )
  if (cache.has(filename)) return cache.get(filename)
  const ast = parse(relative)
  const transpiled = ts.transpileModule(ast.text, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  })
  const errors = (transpiled.diagnostics || []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error,
  )
  assert.equal(
    errors.length,
    0,
    `TypeScript syntax in ${relative}: ${errors
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
      .join('; ')}`,
  )
  const exports = {}
  cache.set(filename, exports)
  const restrictedRequire = (name) => {
    if (name === 'polished') return polished
    if (name === '@/styles/tokens') return load(adapterSource)
    if (name === '@packages/design-tokens') return load(tokenSource)
    if (name === '@/utils/css-in-js') return load(helperSource)
    if (name.startsWith('.')) {
      return load(
        path.relative(root, path.resolve(path.dirname(filename), name + '.ts')),
      )
    }
    throw new Error(`Unexpected executable dependency ${name} in ${relative}`)
  }
  try {
    vm.runInNewContext(
      transpiled.outputText,
      { exports, require: restrictedRequire },
      { filename, timeout: 5000 },
    )
  } catch (error) {
    cache.delete(filename)
    throw error
  }
  return exports
}
// Copy across VM realms without JSON's lossy coercions/omitted properties.
function plain(value, label = 'value', ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `Not JSON-safe: ${label}`)
    return value
  }
  assert.equal(typeof value, 'object', `Not JSON-safe: ${label}`)
  assert.ok(!ancestors.has(value), `Not JSON-safe cyclic value: ${label}`)
  const proto = Object.getPrototypeOf(value)
  const array = Array.isArray(value)
  assert.ok(
    array ||
      proto === null ||
      (Object.getPrototypeOf(proto) === null &&
        Object.hasOwn(proto, 'constructor') &&
        proto.constructor.name === 'Object'),
    `Not JSON-safe plain object: ${label}`,
  )
  assert.equal(
    Object.getOwnPropertySymbols(value).length,
    0,
    `Not JSON-safe symbol keys: ${label}`,
  )
  const keys = Object.getOwnPropertyNames(value).filter(
    (key) => !(array && key === 'length'),
  )
  assert.ok(keys.length > 0, `Empty object branch: ${label}`)
  if (array)
    assert.deepEqual(
      keys,
      Array.from({ length: value.length }, (_, i) => String(i)),
      `Not JSON-safe dense array: ${label}`,
    )
  const result = array ? [] : {}
  ancestors.add(value)
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    assert.ok(
      descriptor.enumerable && Object.hasOwn(descriptor, 'value'),
      `Not JSON-safe property: ${label}.${key}`,
    )
    Object.defineProperty(result, key, {
      value: plain(descriptor.value, `${label}.${key}`, ancestors),
      enumerable: true,
      writable: true,
      configurable: true,
    })
  }
  ancestors.delete(value)
  return result
}
function flatten(object, prefix, atomicArrays = false) {
  const result = {}
  const visit = (value, key) => {
    if (
      value !== null &&
      typeof value === 'object' &&
      !(atomicArrays && Array.isArray(value))
    ) {
      for (const [child, entry] of Object.entries(value))
        visit(entry, `${key}.${child}`)
    } else {
      assert.equal(
        Object.hasOwn(result, key),
        false,
        `Duplicate source key: ${key}`,
      )
      Object.defineProperty(result, key, { value, enumerable: true })
    }
  }
  visit(plain(object, prefix), prefix)
  return result
}
function visibleMarkdown(text) {
  const uncommented = text.replace(/<!--[\s\S]*?(?:-->|$)/g, '')
  let fence = null
  return uncommented
    .split('\n')
    .filter((line) => {
      const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
      if (fence) {
        if (
          marker &&
          marker[1][0] === fence[0] &&
          marker[1].length >= fence.length &&
          !marker[2].trim()
        )
          fence = null
        return false
      }
      if (marker) {
        fence = marker[1]
        return false
      }
      return true
    })
    .join('\n')
}
function tableRows(text) {
  return visibleMarkdown(text)
    .split('\n')
    .filter((line) => /^\s*\|/.test(line))
    .map((line) =>
      line
        .trim()
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
}
function tableEntries(text, prefix, valueColumn = 1) {
  const found = {}
  for (const cells of tableRows(text)) {
    const key = cells[0].replace(/^`|`$/g, '')
    if (!key.startsWith(prefix + '.')) continue
    assert.equal(
      Object.hasOwn(found, key),
      false,
      `Duplicate documented ${key}`,
    )
    // This reference uses unescaped pipe-delimited tables, not general Markdown.
    assert.equal(
      cells.length,
      prefix === 'theme' ? 3 : 2,
      `Unsupported table cells/pipe value: ${key}`,
    )
    const encoded = cells[valueColumn].replace(/^`|`$/g, '')
    Object.defineProperty(found, key, {
      value: plain(JSON.parse(encoded), key),
      enumerable: true,
    })
  }
  return found
}
const document = () => fs.readFileSync(regularFile('DESIGN_SYSTEM.md'), 'utf8')
const canonical = () => load(tokenSource)
const isExported = (node) =>
  node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
function sizeHelperNames() {
  const ast = parse(helperSource)
  const functions = new Map()

  const exported = new Map()
  for (const node of ast.statements) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.set(node.name.text, node)
      if (isExported(node)) exported.set(node.name.text, node.name.text)
    } else if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue

        if (
          declaration.initializer &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer) ||
            ts.isIdentifier(declaration.initializer))
        )
          functions.set(declaration.name.text, declaration.initializer)
        if (isExported(node))
          exported.set(declaration.name.text, declaration.name.text)
      }
    } else if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
      assert.ok(
        !node.moduleSpecifier &&
          node.exportClause &&
          ts.isNamedExports(node.exportClause),
        'Unsupported size helper export',
      )
      for (const element of node.exportClause.elements)
        if (!element.isTypeOnly)
          exported.set(
            element.name.text,
            (element.propertyName || element.name).text,
          )
    }
  }
  const names = []
  for (const [name, local] of exported) {
    let fn = functions.get(local)
    const seen = new Set([local])
    while (fn && ts.isIdentifier(fn)) {
      assert.ok(!seen.has(fn.text), `Unsupported cyclic helper alias: ${name}`)
      seen.add(fn.text)
      fn = functions.get(fn.text)
    }
    if (!fn) continue
    let takesSize = false
    for (const parameter of fn.parameters) {
      const visit = (node) => {
        if (
          ts.isTypeReferenceNode(node) &&
          node.typeName.getText(ast) === 'Size'
        )
          takesSize = true
        ts.forEachChild(node, visit)
      }
      if (parameter.type) visit(parameter.type)
    }
    if (takesSize) {
      assert.equal(
        fn.parameters.length,
        1,
        `Unsupported Size helper signature: ${name}`,
      )
      names.push(name)
    }
  }
  assert.ok(names.length > 0, 'Missing exported Size helpers')
  return names.sort()
}
function helperEntries() {
  const helpers = load(helperSource)
  const sizes = ['xs', 'sm', 'md', 'lg']
  assert.deepEqual(
    plain(helpers.sizeValues),
    sizes,
    'Independent four-size domain',
  )
  const result = {}
  for (const name of sizeHelperNames()) {
    assert.equal(
      typeof helpers[name],
      'function',
      `Missing Size helper: ${name}`,
    )
    for (const size of sizes)
      result[`helpers.${name}.${size}`] = plain(
        helpers[name](size),
        `helpers.${name}.${size}`,
      )
  }
  return result
}
test('UI token adapter preserves its independent wildcard re-export contract', () => {
  const ast = parse(adapterSource)
  assert.ok(
    ast.statements.length === 1 &&
      ts.isExportDeclaration(ast.statements[0]) &&
      !ast.statements[0].isTypeOnly &&
      !ast.statements[0].exportClause &&
      ast.statements[0].moduleSpecifier?.text === '@packages/design-tokens',
    'UI token adapter contract: expected only the canonical wildcard re-export',
  )
  const adapter = load(adapterSource)
  const expected = canonical()
  assert.deepEqual(
    Object.keys(adapter).sort(),
    Object.keys(expected).sort(),
    'UI token adapter contract export inventory',
  )
  for (const key of Object.keys(expected))
    assert.equal(
      adapter[key],
      expected[key],
      `UI token adapter contract value: ${key}`,
    )
})
test('root reference contains every canonical token with the exact exported value', () => {
  assert.deepEqual(
    tableEntries(document(), 'tokens'),
    flatten(canonical().tokens, 'tokens', true),
  )
})
test('root reference contains every derived Tailwind value with exact conversion', () => {
  assert.deepEqual(
    tableEntries(document(), 'tailwindTheme'),
    flatten(canonical().tailwindTheme, 'tailwindTheme', true),
  )
})
for (const [mode, column] of [
  ['light', 1],
  ['dark', 2],
]) {
  test(`root reference contains every ${mode} theme leaf with its exact resolved value`, () => {
    const values = load(`packages/ui/src/themes/${mode}.ts`).default
    assert.deepEqual(
      tableEntries(document(), 'theme', column),
      flatten(values, 'theme'),
    )
  })
}
test('root reference contains exact independent four-size output for every exported Size helper', () => {
  assert.deepEqual(tableEntries(document(), 'helpers'), helperEntries())
})
test('public Vue exports exactly match the component index and regular source/README files', () => {
  const base = 'packages/ui/src/components'
  const ast = parse(`${base}/index.ts`)
  const expected = {}
  for (const node of ast.statements) {
    if (ts.isEmptyStatement(node)) continue
    assert.ok(
      ts.isExportDeclaration(node) &&
        !node.isTypeOnly &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text.endsWith('.vue') &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause),
      'Unsupported public export',
    )
    const source = node.moduleSpecifier.text
    assert.ok(
      source.startsWith('./'),
      `Unsupported public export path: ${source}`,
    )
    const family = path.posix.dirname(source).replace(/^\.\//, '')
    const readme = `${base}/${family}/README.md`
    regularFile(`${base}/${source}`)
    assert.ok(
      fs.existsSync(path.join(root, readme)),
      `Missing ${readme} README`,
    )
    regularFile(readme)
    for (const entry of node.exportClause.elements) {
      assert.ok(
        !entry.isTypeOnly &&
          (entry.propertyName || entry.name).text === 'default',
        'Unsupported public export specifier',
      )
      const name = entry.name.text
      assert.equal(
        Object.hasOwn(expected, name),
        false,
        `Duplicate public export ${name}`,
      )
      Object.defineProperty(expected, name, {
        value: { readme, family },
        enumerable: true,
      })
    }
  }
  assert.ok(Object.keys(expected).length > 0)
  const actual = {}
  for (const cells of tableRows(document())) {
    if (!cells[0].includes('](packages/ui/src/components/')) continue
    const match = cells[0].match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    assert.ok(
      match && cells.length === 2 && /^`[^`]+`$/.test(cells[1]),
      'Malformed component inventory row',
    )
    const [, name, readme] = match
    assert.equal(
      Object.hasOwn(actual, name),
      false,
      `Duplicate component ${name}`,
    )
    Object.defineProperty(actual, name, {
      value: { readme, family: cells[1].slice(1, -1) },
      enumerable: true,
    })
  }
  assert.deepEqual(actual, expected, 'Exact component inventory')
})
module.exports = { load, flatten, tableEntries, helperEntries }
