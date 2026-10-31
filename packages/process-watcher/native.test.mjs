import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { runInNewContext } from 'node:vm'
import test from 'node:test'

const require = createRequire(import.meta.url)
function fixture(
  results = {},
  providerPath = path.resolve(
    'resources/app.asar/node_modules/wql-process-monitor/lib/index.js',
  ),
) {
  const calls = [],
    registered = []
  let callback, dllPath, prototype
  const koffi = {
    load(file) {
      dllPath = file
      return {
        func(abi, name, result, args) {
          assert.equal(abi, '__stdcall')
          return {
            async(...values) {
              const done = values.pop()
              calls.push({ name, values })
              queueMicrotask(() => done(null, results[name] ?? 0))
            },
          }
        },
      }
    },
    proto(...args) {
      prototype = args
      return {}
    },
    pointer: (type) => type,
    register(fn, type) {
      callback = fn
      const pointer = {}
      registered.push(pointer)
      calls.push({ name: 'register' })
      return pointer
    },
    unregister(pointer) {
      assert.equal(pointer, registered[0])
      calls.push({ name: 'unregister' })
    },
  }
  const mockRequire = (id) => (id === 'koffi' ? koffi : require(id))
  mockRequire.resolve = () => providerPath
  const module = { exports: {} }
  runInNewContext(
    readFileSync(new URL('./native.js', import.meta.url), 'utf8'),
    {
      module,
      exports: module.exports,
      require: mockRequire,
      process: { arch: 'x64' },
    },
  )
  return {
    subscribe: module.exports.subscribe,
    calls,
    registered,
    prototype,
    dllPath,
    event: (...args) => callback(...args),
  }
}
const options = {
  creation: true,
  deletion: true,
  bin: { filter: ['cmd.exe', 'tlist.exe', 'conhost.exe'] },
}
test('lightweight watcher uses the existing DLL ABI and native WQL exclusions', async () => {
  const f = fixture(),
    monitor = await f.subscribe(options)
  assert.ok(f.dllPath.includes('app.asar.unpacked'))
  assert.ok(f.dllPath.endsWith(path.join('dist', 'processMonitor.x64.dll')))
  assert.equal(f.prototype[0], '__cdecl')
  const sql = f.calls.find((c) => c.name === 'getInstanceEvent').values[0]
  assert.match(
    sql,
    /__InstanceOperationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_Process'/,
  )
  for (const name of options.bin.filter)
    assert.ok(sql.includes(`TargetInstance.Name != '${name}'`))
  const received = []
  monitor.on('creation', (data) => received.push(['creation', ...data]))
  monitor.on('deletion', (data) => received.push(['deletion', ...data]))
  f.event('creation', 'ゲーム.exe', 42, 'C:\\Jeux\\😀.exe', 'José')
  f.event('deletion', 'ゲーム.exe', 42, 'C:\\Jeux\\😀.exe', 'José')
  assert.deepEqual(received, [
    ['creation', 'ゲーム.exe', 42, 'C:\\Jeux\\😀.exe', 'José'],
    ['deletion', 'ゲーム.exe', 42, 'C:\\Jeux\\😀.exe', 'José'],
  ])
  await monitor.close()
  await monitor.close()
  assert.equal(f.calls.filter((c) => c.name === 'closeEventSink').length, 1)
  assert.equal(f.calls.at(-1).name, 'unregister')
})
test('initialization failure reports its HRESULT without registering a callback', async () => {
  const f = fixture({ createEventSink: 0x80010119 | 0 })
  await assert.rejects(
    f.subscribe(options),
    /createEventSink failed.*0x80010119/,
  )
  assert.equal(f.registered.length, 0)
})
test('failed native subscription closes the sink before releasing its callback', async () => {
  const f = fixture({ getInstanceEvent: 0x80041017 | 0 })
  await assert.rejects(
    f.subscribe(options),
    /getInstanceEvent failed.*0x80041017/,
  )
  assert.deepEqual(
    f.calls.slice(-2).map((c) => c.name),
    ['closeEventSink', 'unregister'],
  )
})
test('invalid exclusion names never reach native WQL', async () => {
  const f = fixture()
  await assert.rejects(
    f.subscribe({ bin: { filter: ["name' OR 1=1"] } }),
    /Invalid process exclusion/,
  )
  assert.equal(f.calls.length, 0)
})
