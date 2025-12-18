import { ChildProcess, fork } from 'child_process'
import { v4 as uuid } from 'uuid'
import { onExit } from '@/electron/on-exit.ts'

let winMouseChildProcess: ChildProcess | null = null

const instances = new Map()

export function startMouse(event: string, callback: (...args: any[]) => void) {
  const id = uuid()
  winMouseChildProcess = fork(require.resolve('@packages/win-mouse'), [event])
  winMouseChildProcess.on('message', (args: any) => {
    callback(...args)
  })
  instances.set(id, winMouseChildProcess)
  return id
}

export function stopMouse(id: string) {
  instances.get(id)?.kill()
}

export function killMouse() {
  Array.from(instances.keys()).forEach(stopMouse)
  instances.clear()
}

onExit(killMouse)
