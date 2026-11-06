import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const {
  providers,
  inventory,
  assertInventoryCoverage,
} = require('./providers.cjs')
const { coreCases, validateResults, redactor } = require('./contracts.cjs')
const { checklist, checklistReport } = require('./checklist.cjs')

test('all 44 macro journeys map to known tests or explicit manual boundaries', () => {
  assert.equal(checklist.length, 44)
  assert.equal(new Set(checklist.map((entry) => entry.id)).size, 44)
  const { additionalCases } = require('./contracts.cjs')
  const known = new Set([
    ...coreCases,
    ...providers.map((p) => `${p.kind}: ${p.name}`),
    ...additionalCases(providers),
  ])
  for (const entry of checklist) {
    assert.ok(entry.cases.length || entry.boundary, entry.id)
    for (const name of entry.cases)
      assert.ok(known.has(name), entry.id + ': ' + name)
  }
  assert.ok(checklistReport([]).every((entry) => entry.status !== 'Pass'))
  const report = checklistReport(
    [...known].map((name) => ({ name, pass: true })),
  )
  assert.equal(report.find((entry) => entry.id === 'E2E-21').status, 'Manual')
  assert.equal(report.find((entry) => entry.id === 'E2E-13').status, 'Partial')
})

test('the live provider inventory refers to real application registrations', () => {
  const registrations = new Map()
  for (const kind of [
    'speech-engines',
    'speech-recognition-engines',
    'translation-engines',
  ]) {
    const directory = new URL(
      '../../apps/app/src/plugins/' + kind + '/',
      import.meta.url,
    )
    for (const entry of readdirSync(directory)) {
      const source = readFileSync(
        new URL(entry + '/shared.ts', directory),
        'utf8',
      )
      const id = source.match(/ENGINE_ID = '([^']+)'/)[1]
      registrations.set(id, source)
    }
  }
  assert.equal(new Set(providers.map((p) => p.id)).size, providers.length)
  for (const provider of providers)
    assert.ok(registrations.has(provider.id), provider.id)
  assert.equal(providers.filter((p) => p.kind === 'tts').length, 6)
  assert.equal(providers.filter((p) => p.kind === 'stt').length, 6)
  assert.equal(providers.filter((p) => p.kind === 'translation').length, 5)
})
test('partial credentials are reported as unconfigured rather than an enabled test', () => {
  const values = {
    VITE_SPEECH_ENGINE_AMAZON_POLLY_IDENTITY_POOL_ID: 'synthetic-pool',
  }
  const polly = inventory(values).find((p) => p.id === 'aptts')
  assert.equal(polly.enabled, false)
  assert.deepEqual(polly.missing, ['VITE_SPEECH_ENGINE_AMAZON_POLLY_REGION'])
  values.VITE_SPEECH_ENGINE_AMAZON_POLLY_REGION = 'eu-west-1'
  assert.equal(inventory(values).find((p) => p.id === 'aptts').enabled, true)
})
test('newly configured providers cannot be silently omitted from live testing', () => {
  assert.doesNotThrow(() =>
    assertInventoryCoverage({ VITE_SPEECH_ENGINE_OPENAI_API_KEY: 'synthetic' }),
  )
  assert.throws(
    () =>
      assertInventoryCoverage({
        VITE_SPEECH_ENGINE_NEW_PROVIDER_API_KEY: 'synthetic',
      }),
    /no app test/,
  )
})
test('an incomplete or duplicated green report cannot pass the app suite', () => {
  const results = coreCases.map((name) => ({ name, pass: true }))
  validateResults(results, coreCases)
  assert.throws(
    () => validateResults(results.slice(1), coreCases),
    /Missing or unexpected/,
  )
  assert.throws(
    () => validateResults([...results, results[0]], coreCases),
    /Duplicate/,
  )
  assert.throws(
    () =>
      validateResults(
        results.map((r, i) => (i ? r : { ...r, pass: false })),
        coreCases,
      ),
    /App tests failed/,
  )
})
test('reports redact injected credentials, parsed service-account fields, and bearer tokens', () => {
  const sanitize = redactor({
    VITE_TEST_API_KEY: 'synthetic-key',
    VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT: JSON.stringify({
      private_key: 'synthetic-private-key',
      client_email: 'service@example.test',
    }),
  })
  const text = sanitize(
    'synthetic-key synthetic-private-key service@example.test Bearer synthetic-token',
  )
  assert.ok(!text.includes('synthetic'))
  assert.ok(!text.includes('example.test'))
})

test('tray journey hides through the worker bridge without awaiting a hidden renderer', async () => {
  const module = { exports: {} }
  const display = { bounds: { x: 0, y: 0, width: 800, height: 600 } }
  const app = { relaunch() {}, exit() {} }
  let visible = true
  let hideRequests = 0
  let trayClicks = 0
  let resets = 0
  let bounds = { x: 0, y: 0, width: 800, height: 600 }
  const screen = {
    getPrimaryDisplay: () => display,
    getAllDisplays: () => [display],
    emit: () => {
      bounds = { ...display.bounds }
    },
  }
  runInNewContext(
    readFileSync(new URL('./resilience-journeys.cjs', import.meta.url), 'utf8'),
    {
      module,
      exports: module.exports,
      require: (id) => (id === 'electron' ? { app, screen } : require(id)),
    },
  )
  const messenger = {
    isVisible: () => visible,
    setPosition(x, y) {
      bounds = { ...bounds, x, y }
    },
    getBounds: () => bounds,
  }
  const { resilienceCases, runResilience } = module.exports
  const worker = {}
  await runResilience({
    messenger,
    worker,
    check: async (name, fn) => {
      if (name === resilienceCases[5]) await fn()
    },
    selectTts: async () => {},
    patch: async () => {},
    keyEvent() {},
    read: async () => {
      assert.equal(resets, 1)
      return null
    },
    until: async (check, label) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (await check()) return
        await Promise.resolve()
      }
      assert.fail(label)
    },
    evaluate: async (target, fn) => {
      assert.equal(target, worker, 'journey awaited a hidden renderer reply')
      const value = runInNewContext(`(${fn.toString()})()`, {
        window: {
          ElectronMessengerWindow: {
            hide() {
              hideRequests++
              visible = false
              return Promise.resolve(true)
            },
          },
        },
      })
      return value
    },
    trayRecords: [
      {
        tray: {
          emit(event) {
            assert.equal(event, 'click')
            trayClicks++
            visible = true
          },
        },
        menu: {
          items: [
            {
              label: 'Settings',
              submenu: {
                items: [
                  {
                    label: 'Reset Display',
                    click() {
                      resets++
                    },
                  },
                ],
              },
            },
            {
              label: 'Restart',
              click() {
                app.relaunch()
                app.exit()
              },
            },
          ],
        },
      },
    ],
  })
  assert.equal(hideRequests, 1)
  assert.equal(trayClicks, 1)
  assert.equal(resets, 1)
  assert.equal(visible, true)
  assert.deepEqual(bounds, display.bounds)
})

for (const [filename, expected] of [
  ['edge-journeys.cjs', 2],
  ['runtime.cjs', 1],
]) {
  test(`${filename} hide/reopen callbacks run through the worker bridge`, async () => {
    const source = readFileSync(new URL(filename, import.meta.url), 'utf8')
    const parsed = ts.createSourceFile(
      filename,
      source,
      ts.ScriptTarget.Latest,
      true,
    )
    const calls = []
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(parsed) === 'evaluate'
      ) {
        const callback = node.arguments[1]
        if (
          callback &&
          /ElectronMessengerWindow\.hide\(/.test(callback.getText(parsed))
        )
          calls.push(node)
      }
      ts.forEachChild(node, visit)
    }
    visit(parsed)
    assert.equal(
      calls.length,
      expected,
      'every hide/reopen callback is exercised',
    )
    for (const call of calls) {
      assert.equal(
        call.arguments[0].getText(parsed),
        'worker',
        'hide/reopen must not await the renderer being hidden',
      )
      const observed = []
      await runInNewContext(`(${call.arguments[1].getText(parsed)})()`, {
        window: {
          ElectronMessengerWindow: {
            hide: async (returnFocus) => {
              observed.push(['hide', returnFocus])
              return true
            },
            show: async () => {
              observed.push(['show'])
              return true
            },
          },
        },
      })
      assert.deepEqual(observed, [['hide', false], ['show']])
    }
  })
}
