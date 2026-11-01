/** Current and peak memory usage in KB. */
export interface Memory {
  current: number
  peak: number
}
/** A loaded module reported by tlist. */
export interface Module {
  version: string
  _attributes: string
  address: string
  path: string
}
/** An execution thread reported by tlist. */
export interface Thread {
  id: number
  startAddress: string
  lastError: string
  state: string
}
/** Parsed process details; absent numeric fields default to zero. */
export interface ProcessInfo {
  modules: Module[]
  threads: Thread[]
  workingDirectory: string
  command: string
  virtualMemory: Memory
  workingMemory: Memory
  threadCount: number
}
/** Query a PID, or tlist itself when omitted. Rejects with the exec error. */
export function getProcessInfo(pid?: number): Promise<ProcessInfo>
