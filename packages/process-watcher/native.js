const { EventEmitter } = require('node:events')
const path = require('node:path')
const koffi = require('koffi')

// Keep the pinned provider's DLL and ABI, without loading its general-purpose
// validation and Windows error-code catalogs in every watcher process.
const dllPath = path
  .join(
    path.dirname(require.resolve('wql-process-monitor')),
    'dist',
    `processMonitor.${process.arch === 'ia32' ? 'x86' : process.arch}.dll`,
  )
  .replace(/(^|[\\/])app\.asar([\\/])/, '$1app.asar.unpacked$2')
const library = koffi.load(dllPath)
const callbackType = koffi.pointer(
  koffi.proto('__cdecl', 'IzabelaProcessEvent', 'void', [
    'string',
    'string',
    'uint32',
    'string',
    'string',
  ]),
)
const create = library.func('__stdcall', 'createEventSink', 'long', [])
const setCallback = library.func('__stdcall', 'setCallback', 'void', [
  callbackType,
])
const query = library.func('__stdcall', 'getInstanceEvent', 'long', ['string'])
const close = library.func('__stdcall', 'closeEventSink', 'void', [])
const invoke = (fn, ...args) =>
  new Promise((resolve, reject) => {
    fn.async(...args, (error, result) =>
      error ? reject(error) : resolve(result),
    )
  })
const check = (result, operation) => {
  if (result < 0)
    throw new Error(
      `${operation} failed (HRESULT 0x${(result >>> 0).toString(16)})`,
    )
}

exports.subscribe = async ({ bin: { filter } }) => {
  const exclusions = filter
    .map((name) => {
      if (!/^[\w. -]+$/.test(name)) throw new Error('Invalid process exclusion')
      return `AND TargetInstance.Name != '${name}'`
    })
    .join(' ')
  const statement = `SELECT * FROM __InstanceOperationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_Process' ${exclusions}`
  const monitor = new EventEmitter()
  let pointer
  let started = false
  try {
    check(await invoke(create), 'createEventSink')
    started = true
    pointer = koffi.register((event, name, pid, filepath, user) => {
      monitor.emit(event, [name, pid, filepath, user])
    }, callbackType)
    await invoke(setCallback, pointer)
    check(await invoke(query, statement), 'getInstanceEvent')
  } catch (error) {
    if (started) await invoke(close).catch(() => {})
    if (pointer) koffi.unregister(pointer)
    throw error
  }
  monitor.close = async () => {
    if (!started) return
    await invoke(close)
    started = false
    koffi.unregister(pointer)
    monitor.removeAllListeners()
  }
  return monitor
}
