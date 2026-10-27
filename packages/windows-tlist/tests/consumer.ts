import tlist = require('..')
import {
  getProcessInfo,
  type ProcessInfo,
  type Thread,
  type Module,
  type Memory,
} from '..'
const result: Promise<ProcessInfo> = tlist.getProcessInfo()
const explicit: Promise<ProcessInfo> = getProcessInfo(42)
void result.then((info) => {
  const thread: Thread | undefined = info.threads[0]
  const module: Module | undefined = info.modules[0]
  const memory: Memory = info.virtualMemory
  const path: string | undefined = module?.path
  const state: string | undefined = thread?.state
  const count: number = info.threadCount
  void [memory, path, state, count]
  // @ts-expect-error process details are not a string
  const invalid: string = info
  void invalid
})
// @ts-expect-error PID is numeric, not an exec options object
getProcessInfo({ shell: true })
// @ts-expect-error no callback overload exists
getProcessInfo(1, () => {})
// @ts-expect-error string PID is not the declared public API
getProcessInfo('42')
// @ts-expect-error no process enumeration API exists
void tlist.list
// @ts-expect-error promise result is not synchronous process information
const sync: ProcessInfo = explicit
void sync
type IsAny<T> = 0 extends 1 & T ? true : false
const typed: IsAny<Awaited<ReturnType<typeof getProcessInfo>>> = false
void typed
