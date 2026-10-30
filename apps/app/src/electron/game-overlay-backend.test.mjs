import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../tests/load-typescript.cjs'

function fixture(experimental = false, ready = Promise.resolve()) {
  const calls = []
  const store = {
    enableGameOverlay: false,
    enableExperimentalGameOverlay: experimental,
    $whenReady: () => ready,
  }
  const make = (name) => ({
    start: async () => {
      calls.push(`${name}:start`)
    },
    quit: () => calls.push(`${name}:quit`),
    createWindow: () => {
      calls.push(`${name}:window`)
      return name
    },
    addOverlayWindow() {},
    isReady: async () => true,
    isProcessHooked: () => true,
    startIntercept: () => calls.push(`${name}:input`),
    stopIntercept: () => calls.push(`${name}:release`),
    intercepting: true,
  })
  const legacy = make('legacy'),
    rc = make('experimental')
  const overlay = loadTypescript(
    fileURLToPath(new URL('./game-overlay-backend.ts', import.meta.url)),
    {
      '@/electron/game-overlay': legacy,
      '@/electron/experimental-game-overlay': rc,
      '@/features/game-overlay/store': { useGameOverlayStore: () => store },
    },
    { console: { error() {} } },
  ).default
  return { overlay, store, calls, legacy, rc }
}

test('default startup preserves the legacy backend without starting experimental', async () => {
  const f = fixture()
  await f.overlay.start()
  assert.deepEqual(f.calls, ['legacy:start'])
  assert.equal(f.overlay.enabled, false)
  f.store.enableGameOverlay = true
  assert.equal(f.overlay.enabled, true)
})

test('experimental opt-in chooses RC only, even with both persisted flags true', async () => {
  const f = fixture(true)
  f.store.enableGameOverlay = true
  await f.overlay.start()
  assert.deepEqual(f.calls, ['experimental:start'])
  assert.equal(f.overlay.enabled, true)
  assert.equal(
    f.overlay.createWindow('messenger-game-overlay', {}),
    'experimental',
  )
})

test('backend choice stays frozen until restart and disabled input cannot leak', async () => {
  const f = fixture()
  f.store.enableGameOverlay = true
  await f.overlay.start()
  f.store.enableExperimentalGameOverlay = true
  f.store.enableGameOverlay = false
  assert.equal(f.overlay.enabled, false)
  assert.equal(f.overlay.isProcessHooked(42), false)
  f.overlay.startIntercept()
  await f.overlay.start()
  assert.deepEqual(f.calls, ['legacy:start'])
})

test('renderer backend identity remains frozen when settings change before restart', async () => {
  for (const enabled of [false, true]) {
    const f = fixture(enabled)
    await f.overlay.start()
    assert.equal(f.overlay.isExperimental, enabled)
    f.store.enableExperimentalGameOverlay = !enabled
    assert.equal(f.overlay.isExperimental, enabled)
  }
})

test('experimental startup failure does not start legacy or reject app startup', async () => {
  const f = fixture(true)
  f.rc.start = async () => {
    throw new Error('fixture failure')
  }
  await f.overlay.start()
  assert.equal(f.overlay.enabled, false)
  assert.equal(f.overlay.isProcessHooked(42), false)
  assert.ok(!f.calls.some((call) => call.startsWith('legacy:')))
})

test('quit while settings hydration is pending prevents either backend startup', async () => {
  let resolve
  const f = fixture(
    true,
    new Promise((done) => {
      resolve = done
    }),
  )
  const task = f.overlay.start()
  f.overlay.quit()
  resolve()
  await task
  assert.deepEqual(f.calls, [])
})
