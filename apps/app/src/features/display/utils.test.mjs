import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'
import { reactive, watch, nextTick } from 'vue'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const utilsFile = resolve(root, 'features/display/utils.ts')
const primary = {
  id: 2,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
}
const secondary = {
  id: 22,
  bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
}

function loadWindow(filename, name, settings) {
  const source = readFileSync(filename, 'utf8')
  const ast = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
  )
  let expression
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) {
      expression = node.initializer.getText(ast)
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.ok(expression, `${name} exists`)
  const imports = ast.statements
    .filter(ts.isImportDeclaration)
    .map((node) => node.getText(ast))
    .join('\n')
  const positions = []
  const mocks = {
    electron: {
      screen: {
        getAllDisplays: () => [primary, secondary],
        getPrimaryDisplay: () => primary,
      },
    },
    '@/features/display/utils': {
      get findDisplay() {
        return loadTypescript(utilsFile).findDisplay
      },
    },
    '@/electron/utils': {
      get boundsMatch() {
        return loadTypescript(resolve(root, 'electron/utils.ts'), mocks, {
          process: { resourcesPath: '' },
          __dirname: dirname(filename),
        }).boundsMatch
      },
    },
  }
  const module = loadTypescript(
    filename,
    mocks,
    {
      settingsStore: settings,
      getWindow: () => ({
        setBounds: (bounds) => positions.push(bounds),
        setPosition: (x, y) => positions.push({ x, y }),
      }),
    },
    `${imports}\nexport const invoke = ${expression}`,
  )
  return { invoke: module.invoke, positions }
}

for (const [team, name] of [
  ['messenger', 'setDisplay'],
  ['overlay', 'setDisplay'],
  ['speech-worker', 'show'],
]) {
  test(`${team}: saved bounds win when the old ID belongs to another monitor`, () => {
    const filename = resolve(
      root,
      `teams/${team}/modules/electron-${team}-window/index.ts`,
    )
    const settings = { display: primary.id, displayBounds: secondary.bounds }
    const { invoke, positions } = loadWindow(filename, name, settings)
    invoke(settings.display, settings.displayBounds)
    assert.deepEqual(
      positions[0],
      team === 'speech-worker'
        ? { x: secondary.bounds.x + 24, y: secondary.bounds.y + 24 }
        : secondary.bounds,
    )
  })

  for (const [scenario, settings, expected] of [
    ['legacy ID-only settings', { display: secondary.id }, secondary],
    [
      'unavailable saved monitor',
      {
        display: 999,
        displayBounds: { x: -1920, y: 0, width: 1920, height: 1080 },
      },
      primary,
    ],
  ]) {
    test(`${team}: preserves fallback for ${scenario}`, () => {
      const filename = resolve(
        root,
        `teams/${team}/modules/electron-${team}-window/index.ts`,
      )
      const { invoke, positions } = loadWindow(filename, name, settings)
      invoke(settings.display, settings.displayBounds)
      assert.deepEqual(
        positions[0],
        team === 'speech-worker'
          ? { x: expected.bounds.x + 24, y: expected.bounds.y + 24 }
          : expected.bounds,
      )
    })
  }
}

test('bounds matching still requires exact x, y, width and height', () => {
  const { boundsMatch, findDisplay } = loadTypescript(utilsFile)
  assert.equal(boundsMatch(secondary.bounds, { ...secondary.bounds }), true)
  for (const key of ['x', 'y', 'width', 'height']) {
    const changed = { ...secondary.bounds, [key]: secondary.bounds[key] + 1 }
    assert.equal(boundsMatch(secondary.bounds, changed), false)
    assert.equal(findDisplay([primary, secondary], 999, changed), undefined)
  }
})

test('the resolver supports ID zero and absent display inventories', () => {
  const { findDisplay } = loadTypescript(utilsFile)
  const zero = { ...primary, id: 0 }
  assert.equal(findDisplay([zero], 0), zero)
  assert.equal(findDisplay([], secondary.id, secondary.bounds), undefined)
  assert.equal(findDisplay([primary, secondary], null, null), undefined)
})

test('selecting a reassigned ID updates windows when only the saved bounds change', async () => {
  const settings = reactive({
    display: primary.id,
    displayBounds: { ...secondary.bounds },
  })
  const calls = []
  const stops = []
  const windows = {
    isReady: () => Promise.resolve(),
    setDisplay: (...args) => calls.push(args),
  }
  const register = loadTypescript(
    resolve(root, 'modules/electron-display/register.ts'),
    {
      electron: {
        app: { whenReady: () => Promise.resolve() },
        screen: { on() {} },
      },
      vue: {
        watch: (...args) => {
          const stop = watch(...args)
          stops.push(stop)
          return stop
        },
      },
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/teams/messenger/modules/electron-messenger-window': windows,
      '@/teams/overlay/modules/electron-overlay-window': windows,
      '@/teams/speech-worker/modules/electron-speech-worker-window': windows,
    },
  ).default
  try {
    await register()
    await nextTick()
    calls.length = 0
    Object.assign(settings.displayBounds, primary.bounds)
    await nextTick()
    assert.equal(calls.length, 3)
    assert.equal(calls[0][0], primary.id)
    assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1])), primary.bounds)
  } finally {
    stops.forEach((stop) => stop())
  }
})
