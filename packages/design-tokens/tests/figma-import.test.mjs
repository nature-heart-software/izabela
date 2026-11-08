import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  readdir,
  rm,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

let compileVariables, normalizeSnapshot
try {
  ;({ compileVariables, normalizeSnapshot } = await import(
    '../tools/figma-import.mjs'
  ))
} catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error
}
const fixture = () => ({
  collections: [
    {
      id: 'palette',
      name: 'Colors',
      defaultModeId: 'p-light',
      modes: [
        { modeId: 'p-light', name: 'Light' },
        { modeId: 'p-dark', name: 'Dark' },
      ],
      variableIds: ['gray'],
    },
    {
      id: 'semantic',
      name: 'Semantic Tokens',
      defaultModeId: 'light',
      modes: [
        { modeId: 'light', name: 'Example Light' },
        { modeId: 'dark', name: 'Example Dark' },
      ],
      variableIds: ['background'],
    },
    {
      id: 'helper',
      name: 'Figma',
      defaultModeId: 'helper-mode',
      modes: [{ modeId: 'helper-mode', name: 'Value' }],
      variableIds: ['preview'],
    },
  ],
  variables: [
    {
      id: 'gray',
      name: 'Example/gray/100',
      variableCollectionId: 'palette',
      resolvedType: 'COLOR',
      valuesByMode: {
        'p-light': { r: 1, g: 1, b: 1, a: 1 },
        'p-dark': { r: 0, g: 0, b: 0, a: 0.5 },
      },
    },
    {
      id: 'background',
      name: 'button/primary/background',
      variableCollectionId: 'semantic',
      resolvedType: 'COLOR',
      valuesByMode: {
        light: { type: 'VARIABLE_ALIAS', id: 'gray' },
        dark: { type: 'VARIABLE_ALIAS', id: 'gray' },
      },
    },
    {
      id: 'preview',
      name: 'preview/width',
      variableCollectionId: 'helper',
      resolvedType: 'FLOAT',
      valuesByMode: { 'helper-mode': 300 },
    },
  ],
})

test('imports exact semantic paths and all source modes with cross-collection aliases', () => {
  assert.equal(
    typeof compileVariables,
    'function',
    'variable compiler is available',
  )
  const result = compileVariables(fixture())
  assert.deepEqual(
    result.themes.map(({ id, label }) => ({ id, label })),
    [
      { id: 'example-light', label: 'Example Light' },
      { id: 'example-dark', label: 'Example Dark' },
    ],
  )
  assert.equal(result.themes[0].values.button.primary.background, '#ffffff')
  assert.equal(
    result.themes[1].values.button.primary.background,
    'rgba(0, 0, 0, 0.5)',
  )
  assert.equal(result.themes[0].values.preview, undefined)
  assert.equal(
    result.semanticTokens.colors.button.primary.background.value,
    'var(--nv-button-primary-background)',
  )
})

test('discovers additional modes without a theme allowlist and supports explicit independent mode selections', () => {
  const data = fixture()
  data.collections[1].modes.push({ modeId: 'future', name: 'Future Moon' })
  data.variables[1].valuesByMode.future = { type: 'VARIABLE_ALIAS', id: 'gray' }
  const result = compileVariables(data, {
    collectionModes: { 'Future Moon': { Colors: 'Dark' } },
  })
  assert.equal(result.themes.length, 3)
  assert.equal(
    result.themes[2].values.button.primary.background,
    'rgba(0, 0, 0, 0.5)',
  )
})

test('preserves inherited-looking source paths without mutating shared intrinsics', () => {
  const data = fixture()
  data.variables[0].name = 'toString/importerOwnPath'
  data.variables[1].name = 'hasOwnProperty/importerOwnPath'
  const before = [
    Object.prototype,
    Object.prototype.toString,
    Object.prototype.hasOwnProperty,
  ].map((object) => Object.getOwnPropertyDescriptors(object))
  try {
    const result = compileVariables(data)
    assert.equal(Object.hasOwn(result.themes[0].values, 'toString'), true)
    assert.equal(result.themes[0].values.toString.importerOwnPath, '#ffffff')
    assert.equal(
      result.themes[1].values.toString.importerOwnPath,
      'rgba(0, 0, 0, 0.5)',
    )
    assert.equal(
      result.semanticTokens.colors.hasOwnProperty.importerOwnPath.value,
      'var(--nv-has-own-property-importer-own-path)',
    )
    data.collections[0].variableIds.push('conflict')
    data.variables.push({
      ...data.variables[0],
      id: 'conflict',
      name: 'toString/importerOwnPath/child',
    })
    assert.throws(() => compileVariables(data), /conflict/i)
    for (const [index, object] of [
      Object.prototype,
      Object.prototype.toString,
      Object.prototype.hasOwnProperty,
    ].entries())
      assert.deepEqual(Object.getOwnPropertyDescriptors(object), before[index])
  } finally {
    // Keep a deliberately RED run from leaking its reproduced intrinsic mutation.
    delete Object.prototype.toString.importerOwnPath
    delete Object.prototype.hasOwnProperty.importerOwnPath
  }
})

test('rejects alias target type mismatches, including unselected authored modes', () => {
  for (const modeId of ['p-light', 'unused']) {
    const data = fixture()
    if (modeId === 'unused')
      data.collections[0].modes.push({ modeId, name: 'Unselected' })
    data.collections.push({
      id: 'tokens',
      name: 'Tokens',
      defaultModeId: 'value',
      modes: [{ modeId: 'value', name: 'Value' }],
      variableIds: ['number'],
    })
    data.variables.push({
      id: 'number',
      name: 'radius/md',
      variableCollectionId: 'tokens',
      resolvedType: 'FLOAT',
      valuesByMode: { value: 8 },
    })
    data.variables[0].valuesByMode[modeId] = {
      type: 'VARIABLE_ALIAS',
      id: 'number',
    }
    assert.throws(() => compileVariables(data), /alias.*type/i)
  }
})

test('rejects dangling alias envelopes in an otherwise unselected authored mode', () => {
  for (const alias of [
    { type: 'VARIABLE_ALIAS', id: 'absent' },
    { type: 'VARIABLE_ALIAS' },
  ]) {
    const data = fixture()
    data.collections[0].modes.push({ modeId: 'unused', name: 'Unselected' })
    data.variables[0].valuesByMode.unused = alias
    assert.throws(() => compileVariables(data), /missing.*alias/i)
  }
})

test('rejects cycles in unselected independent modes without positionally pairing collections', async (t) => {
  for (const target of ['gray', 'background'])
    await t.test(
      target === 'gray' ? 'same collection' : 'cross collection',
      () => {
        const data = fixture()
        data.collections[0].modes.push({ modeId: 'unused', name: 'Unselected' })
        data.variables[0].valuesByMode.unused = {
          type: 'VARIABLE_ALIAS',
          id: target,
        }
        if (target === 'background')
          data.variables[1].valuesByMode.light = { r: 1, g: 1, b: 1, a: 1 }
        assert.throws(() => compileVariables(data), /cyclic.*alias/i)
      },
    )
})

test('retains a consistent collection mode along alias paths instead of reporting union-graph false cycles', () => {
  const data = fixture()
  data.collections[0].variableIds.push('other')
  data.variables.push({
    ...structuredClone(data.variables[0]),
    id: 'other',
    name: 'Example/gray/200',
  })
  const [gray, background, , other] = data.variables
  gray.valuesByMode['p-light'] = { type: 'VARIABLE_ALIAS', id: 'background' }
  background.valuesByMode.light = { type: 'VARIABLE_ALIAS', id: 'other' }
  background.valuesByMode.dark = { r: 0, g: 0, b: 0, a: 1 }
  other.valuesByMode['p-dark'] = { type: 'VARIABLE_ALIAS', id: 'gray' }
  const result = compileVariables(data)
  assert.equal(result.themes[0].values.Example.gray[100], '#ffffff')
  assert.equal(result.themes[1].values.Example.gray[200], 'rgba(0, 0, 0, 0.5)')
  // Inventory order and collection-local mode IDs do not establish pairings.
  data.collections.reverse()
  for (const collection of data.collections) collection.modes.reverse()
  assert.deepEqual(
    compileVariables(data)
      .themes.map(({ id, values }) => ({ id, values }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    result.themes
      .map(({ id, values }) => ({ id, values }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  )
})

test('retains the authored default mode even when it is not first', () => {
  const data = fixture()
  data.collections[1].defaultModeId = 'dark'
  assert.equal(compileVariables(data).defaultThemeId, 'example-dark')
})

test('accepts the standard local-variable REST export without losing independent modes or aliases', () => {
  const data = fixture()
  const rest = {
    meta: {
      variableCollections: Object.fromEntries(
        data.collections.map((entry) => [entry.id, entry]),
      ),
      variables: Object.fromEntries(
        data.variables.map((entry) => [entry.id, entry]),
      ),
    },
  }
  assert.deepEqual(
    compileVariables(normalizeSnapshot(rest)),
    compileVariables(data),
  )
})

test('read-only plugin exporter preserves exact mode data and reports missing variables', async () => {
  const source = await readFile(
    new URL('../tools/figma-export.js', import.meta.url),
    'utf8',
  )
  const data = fixture()
  for (const missing of [false, true]) {
    let message
    let shown = false
    const figma = new Proxy(
      {
        variables: {
          getLocalVariableCollectionsAsync: async () => data.collections,
          getVariableByIdAsync: async (id) =>
            missing ? null : data.variables.find((entry) => entry.id === id),
        },
        showUI: () => {
          shown = true
        },
        ui: {
          postMessage: (value) => {
            message = JSON.parse(JSON.stringify(value))
          },
        },
      },
      {
        get(target, key) {
          if (!(key in target))
            throw new Error(`Unexpected Figma operation: ${String(key)}`)
          return target[key]
        },
      },
    )
    await runInNewContext(source, { figma })
    assert.equal(shown, true)
    if (missing) assert.match(message.error, /disappeared/)
    else assert.deepEqual(message.snapshot, data)
  }
})

test('exports primitives under their authored names and registers all palette tokens', () => {
  const data = fixture()
  data.collections.push({
    id: 'tokens',
    name: 'Tokens',
    defaultModeId: 'value',
    modes: [{ modeId: 'value', name: 'Value' }],
    variableIds: ['radius'],
  })
  data.variables.push({
    id: 'radius',
    name: 'radius/md',
    variableCollectionId: 'tokens',
    resolvedType: 'FLOAT',
    valuesByMode: { value: 8 },
  })
  const result = compileVariables(data)
  assert.equal(result.primitives.radius.md, 8)
  assert.equal(
    result.paletteTokens.colors.Example.gray[100].value,
    'var(--nv--example-gray-100)',
  )
})

test('resolves primitive aliases rather than exporting alias envelopes as application values', () => {
  const data = fixture()
  data.collections.push({
    id: 'tokens',
    name: 'Tokens',
    defaultModeId: 'value',
    modes: [{ modeId: 'value', name: 'Value' }],
    variableIds: ['radius', 'alias'],
  })
  data.variables.push(
    {
      id: 'radius',
      name: 'radius/md',
      variableCollectionId: 'tokens',
      resolvedType: 'FLOAT',
      valuesByMode: { value: 8 },
    },
    {
      id: 'alias',
      name: 'radius/sm',
      variableCollectionId: 'tokens',
      resolvedType: 'FLOAT',
      valuesByMode: { value: { type: 'VARIABLE_ALIAS', id: 'radius' } },
    },
  )
  assert.equal(compileVariables(data).primitives.radius.sm, 8)
})

test('composes source shadow geometry with the exact semantic shadow-color path', () => {
  const data = fixture()
  data.collections.push({
    id: 'tokens',
    name: 'Tokens',
    defaultModeId: 'value',
    modes: [{ modeId: 'value', name: 'Value' }],
    variableIds: ['offset', 'blur', 'spread'],
  })
  for (const [id, name, value] of [
    ['offset', 'offsetY', 2],
    ['blur', 'blur', 1],
    ['spread', 'spread', 0],
  ])
    data.variables.push({
      id,
      name: `shadow/${name}`,
      variableCollectionId: 'tokens',
      resolvedType: 'FLOAT',
      valuesByMode: { value },
    })
  data.variables[1].name = 'card/default/shadow'
  const result = compileVariables(data)
  assert.equal(
    result.semanticTokens.shadows.card.default.shadow.value,
    '0 2px 1px 0px {colors.card.default.shadow}',
  )
})

test('CLI regenerates deterministic artifacts, checks drift, and leaves outputs intact on invalid input', async (t) => {
  const root = await mkdtemp(
    join(process.env.TMPDIR || tmpdir(), 'figma-import-'),
  )
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'tools'))
  await writeFile(
    join(root, 'tools', 'figma-import.mjs'),
    await readFile(new URL('../tools/figma-import.mjs', import.meta.url)),
  )
  const input = join(root, 'input.json')
  await writeFile(input, JSON.stringify(fixture()))
  const run = (...args) =>
    spawnSync(
      process.execPath,
      [join(root, 'tools', 'figma-import.mjs'), ...args],
      { encoding: 'utf8' },
    )
  const generated = run(input)
  assert.equal(generated.status, 0, generated.stderr)
  const output = join(root, 'src', 'figma.generated.json')
  assert.ok((await readFile(output, 'utf8')).includes('button'))
  assert.match(
    await readFile(join(root, 'src', 'primitives.generated.ts'), 'utf8'),
    /export const tokens/,
  )
  assert.equal(run('--check').status, 0)
  await writeFile(output, '{}\n')
  const outputPaths = [
    'figma/variables.json',
    'src/primitives.generated.ts',
    'src/figma.generated.json',
  ]
  const readOutputs = () =>
    Promise.all(outputPaths.map((path) => readFile(join(root, path), 'utf8')))
  const before = await readOutputs()
  assert.equal(run('--check').status, 1)
  assert.deepEqual(
    await readOutputs(),
    before,
    'drift checks never write any output',
  )
  for (const unused of [false, true]) {
    const data = fixture()
    if (unused) {
      data.collections[0].modes.push({ modeId: 'unused', name: 'Unselected' })
      data.variables[0].valuesByMode.unused = {
        type: 'VARIABLE_ALIAS',
        id: 'absent',
      }
    } else data.variables[1].valuesByMode.light.id = 'absent'
    await writeFile(input, JSON.stringify(data))
    const failed = run(input)
    assert.equal(failed.status, 1)
    assert.match(failed.stderr, /Missing variable alias/)
    assert.deepEqual(
      await readOutputs(),
      before,
      'complete validation precedes every output write',
    )
  }
})

test(
  'CLI rolls back all outputs after a real mid-replacement rename failure',
  { timeout: 30000 },
  async (t) => {
    for (const existing of ['all', 'none', 'snapshot-only'])
      await t.test(existing, async (t) => {
        const root = await mkdtemp(
          join(process.env.TMPDIR || tmpdir(), 'figma-rollback-'),
        )
        t.after(() => rm(root, { recursive: true, force: true }))
        await mkdir(join(root, 'tools'))
        await writeFile(
          join(root, 'tools/figma-import.mjs'),
          await readFile(new URL('../tools/figma-import.mjs', import.meta.url)),
        )
        const data = fixture()
        data.collections.push({
          id: 'tokens',
          name: 'Tokens',
          defaultModeId: 'value',
          modes: [{ modeId: 'value', name: 'Value' }],
          variableIds: ['radius'],
        })
        data.variables.push({
          id: 'radius',
          name: 'radius/md',
          variableCollectionId: 'tokens',
          resolvedType: 'FLOAT',
          valuesByMode: { value: 8 },
        })
        const input = join(root, 'input.json')
        await writeFile(input, JSON.stringify(data))
        const run = (preload) =>
          spawnSync(
            process.execPath,
            [
              ...(preload ? ['--require', preload] : []),
              join(root, 'tools/figma-import.mjs'),
              input,
            ],
            { encoding: 'utf8', timeout: 10000 },
          )
        const paths = [
          'figma/variables.json',
          'src/primitives.generated.ts',
          'src/figma.generated.json',
        ]
        assert.equal(run().status, 0)
        if (existing !== 'all')
          for (const path of paths.slice(existing === 'snapshot-only' ? 1 : 0))
            await rm(join(root, path))
        const readOutputs = () =>
          Promise.all(
            paths.map((path) =>
              readFile(join(root, path), 'utf8').catch((error) => {
                if (error.code === 'ENOENT') return null
                throw error
              }),
            ),
          )
        const before = await readOutputs()
        data.variables.at(-1).valuesByMode.value = 123
        await writeFile(input, JSON.stringify(data))
        const preload = join(root, 'rename-failure.cjs')
        await writeFile(
          preload,
          `
const fs = require('node:fs/promises')
const original = fs.rename
let calls = 0
fs.rename = async (...args) => {
  if (++calls === 3) {
    const error = new Error('Injected one-shot ENOSPC at third rename')
    error.code = 'ENOSPC'
    throw error
  }
  return original(...args)
}
require('node:module').syncBuiltinESMExports()
`,
        )
        const failed = run(preload)
        assert.equal(failed.status, 1, failed.stderr)
        assert.match(failed.stderr, /Injected one-shot ENOSPC at third rename/)
        assert.deepEqual(
          await readOutputs(),
          before,
          'all prior bytes or absence must be restored',
        )
        for (const directory of ['figma', 'src'])
          assert.equal(
            (await readdir(join(root, directory))).some((name) =>
              /\.(pending|previous)$/.test(name),
            ),
            false,
            'owned staging and backups must be cleaned',
          )
        assert.equal(run().status, 0, 'a later ordinary import still succeeds')
        assert.notDeepEqual(await readOutputs(), before)
      })
  },
)

test(
  'CLI preserves preexisting pending files when exclusive staging fails',
  { timeout: 10000 },
  async (t) => {
    const root = await mkdtemp(
      join(process.env.TMPDIR || tmpdir(), 'figma-stage-owner-'),
    )
    t.after(() => rm(root, { recursive: true, force: true }))
    await mkdir(join(root, 'tools'))
    await mkdir(join(root, 'src'))
    await writeFile(
      join(root, 'tools/figma-import.mjs'),
      await readFile(new URL('../tools/figma-import.mjs', import.meta.url)),
    )
    const input = join(root, 'input.json')
    await writeFile(input, JSON.stringify(fixture()))
    const preload = join(root, 'stage-collision.cjs')
    await writeFile(
      preload,
      `
const fs = require('node:fs')
const path = require('node:path')
fs.writeFileSync(path.join(__dirname, 'src', 'primitives.generated.ts.' + process.pid + '.pending'), 'other owner bytes', { flag: 'wx' })
`,
    )
    const failed = spawnSync(
      process.execPath,
      ['--require', preload, join(root, 'tools/figma-import.mjs'), input],
      { encoding: 'utf8', timeout: 5000 },
    )
    assert.equal(failed.status, 1, failed.stderr)
    assert.match(failed.stderr, /EEXIST/)
    assert.equal(
      await readFile(
        join(root, `src/primitives.generated.ts.${failed.pid}.pending`),
        'utf8',
      ),
      'other owner bytes',
    )
    for (const path of [
      'figma/variables.json',
      'src/primitives.generated.ts',
      'src/figma.generated.json',
    ])
      await assert.rejects(readFile(join(root, path)), { code: 'ENOENT' })
  },
)

test('validates collection ownership, complete inventories, scalar types, and finite color channels', async (t) => {
  const cases = [
    [
      'duplicate variable',
      (data) => data.variables.push(data.variables[0]),
      /duplicate/i,
    ],
    [
      'duplicate collection',
      (data) => data.collections.push(data.collections[0]),
      /duplicate/i,
    ],
    [
      'wrong owner',
      (data) => {
        data.variables[1].variableCollectionId = 'palette'
      },
      /owner|collection/i,
    ],
    [
      'unlisted variable',
      (data) => data.variables.push({ ...data.variables[0], id: 'extra' }),
      /inventory|unlisted/i,
    ],
    [
      'nonfinite color',
      (data) => {
        data.variables[0].valuesByMode['p-light'].r = NaN
      },
      /color/i,
    ],
    [
      'out-of-range color',
      (data) => {
        data.variables[0].valuesByMode['p-light'].r = 2
      },
      /color/i,
    ],
    [
      'missing default',
      (data) => {
        data.collections[0].defaultModeId = 'absent'
      },
      /default.*mode/i,
    ],
  ]
  for (const [name, mutate, message] of cases)
    await t.test(name, () => {
      const data = fixture()
      mutate(data)
      assert.throws(() => compileVariables(data), message)
    })
})

test('rejects incomplete or ambiguous exports before generating themes', () => {
  const cases = [
    [
      (data) => {
        delete data.variables[1].valuesByMode.dark
      },
      /missing.*mode/i,
    ],
    [
      (data) => {
        data.variables[1].valuesByMode.light.id = 'absent'
      },
      /missing.*alias/i,
    ],
    [
      (data) => {
        data.variables[1].valuesByMode.light.id = 'background'
      },
      /cyclic/i,
    ],
    [
      (data) => {
        data.variables[1].valuesByMode.light.id = 'preview'
      },
      /Figma/,
    ],
    ...[
      'button/primary',
      'button-primary-background',
      'button/__proto__/background',
    ].map((name) => [
      (data) => {
        data.collections[1].variableIds.push('conflict')
        data.variables.push({ ...data.variables[1], id: 'conflict', name })
      },
      /collision|unsafe|conflict/i,
    ]),
    [
      (data) => {
        data.collections[1].modes.push({
          modeId: 'duplicate',
          name: 'Example-Light',
        })
        data.variables[1].valuesByMode.duplicate = {
          type: 'VARIABLE_ALIAS',
          id: 'gray',
        }
      },
      /mode.*collision/i,
    ],
  ]
  for (const [mutate, message] of cases) {
    const data = fixture()
    mutate(data)
    assert.throws(() => compileVariables(data), message)
  }
})
