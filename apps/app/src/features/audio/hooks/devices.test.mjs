import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { effectScope, nextTick, ref } from 'vue'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

const settle = async () => {
  await nextTick()
  await new Promise(setImmediate)
}
const input = { kind: 'audioinput', deviceId: 'mic', label: 'Microphone' }
const output = { kind: 'audiooutput', deviceId: 'speaker', label: 'Speakers' }
function fixture(t, enumerate = async () => [input, output], supported = true) {
  let calls = 0
  const listeners = new Set(),
    warnings = [],
    scopes = []
  const media = {
    enumerateDevices: () => {
      calls++
      return enumerate()
    },
    addEventListener: (type, fn) => {
      assert.equal(type, 'devicechange')
      listeners.add(fn)
    },
    removeEventListener: (type, fn) => listeners.delete(fn),
  }
  const { useAudioDevices } = loadTypescript(
    fileURLToPath(new URL('./devices.ts', import.meta.url)),
    {},
    {
      navigator: supported ? { mediaDevices: media } : {},
      console: { warn: (...args) => warnings.push(args) },
    },
  )
  t.after(() => scopes.forEach((s) => s.stop()))
  const use = (enabled = true) => {
    const scope = effectScope()
    scopes.push(scope)
    return {
      list: scope.run(() => useAudioDevices(enabled)),
      stop: () => scope.stop(),
    }
  }
  return {
    use,
    listeners,
    warnings,
    calls: () => calls,
    change: () => [...listeners].forEach((fn) => fn()),
  }
}
test('idle consumers do not enumerate; activating and disposing release the shared listener', async (t) => {
  const f = fixture(t),
    enabled = ref(false),
    { list, stop } = f.use(enabled)
  assert.equal(f.calls(), 0)
  assert.equal(f.listeners.size, 0)
  enabled.value = true
  await settle()
  assert.equal(f.calls(), 1)
  assert.equal(f.listeners.size, 1)
  assert.deepEqual(list.audioInputs.value, [input])
  assert.deepEqual(list.audioOutputs.value, [output])
  enabled.value = false
  await settle()
  assert.equal(f.listeners.size, 0)
  assert.equal(list.audioInputs.value.length, 0)
  stop()
})
test('active pickers share enumeration and continue receiving device reconnections', async (t) => {
  let current = [input, output]
  const f = fixture(t, async () => current),
    a = f.use(),
    b = f.use()
  await settle()
  assert.equal(f.calls(), 1)
  assert.equal(f.listeners.size, 1)
  current = [output]
  f.change()
  await settle()
  assert.equal(a.list.audioInputs.value.length, 0)
  assert.deepEqual(b.list.audioOutputs.value, [output])
  a.stop()
  assert.equal(f.listeners.size, 1)
  b.stop()
  assert.equal(f.listeners.size, 0)
})
test('a device-change event during enumeration schedules one current follow-up', async (t) => {
  let resolve
  let first = true
  const f = fixture(t, () => {
    if (first) {
      first = false
      return new Promise((r) => (resolve = r))
    }
    return Promise.resolve([output])
  })
  const { list } = f.use()
  f.change()
  f.change()
  resolve([input])
  await settle()
  assert.equal(f.calls(), 2)
  assert.equal(list.audioInputs.value.length, 0)
  assert.deepEqual(list.audioOutputs.value, [output])
})
test('disabled consumers ignore late results and refresh after reactivation', async (t) => {
  const pending = []
  const f = fixture(t, () => new Promise((resolve) => pending.push(resolve)))
  const enabled = ref(true),
    { list } = f.use(enabled)
  enabled.value = false
  await settle()
  enabled.value = true
  await settle()
  pending[0]([input])
  await settle()
  assert.equal(f.calls(), 2)
  assert.equal(list.audioInputs.value.length, 0)
  pending[1]([output])
  await settle()
  assert.deepEqual(list.audioOutputs.value, [output])
})
test('enumeration failures can recover on a later device-change event', async (t) => {
  let fail = true
  const f = fixture(t, async () => {
    if (fail) throw Error('Unavailable')
    return [input]
  })
  const { list } = f.use()
  await settle()
  assert.equal(f.warnings.length, 1)
  fail = false
  f.change()
  await settle()
  assert.deepEqual(list.audioInputs.value, [input])
})
test('unsupported media APIs do not subscribe or throw', async (t) => {
  const f = fixture(t, undefined, false)
  f.use()
  await settle()
  assert.equal(f.calls(), 0)
  assert.equal(f.listeners.size, 0)
})
