import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve, sep } from 'node:path'
import { runInNewContext } from 'node:vm'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { vi } from 'vitest'
import { isLoaderFailure, resolveRecorderImport } from './loader-paths'
import type * as Public from '..'

const root = resolve('packages/node-record-lpcm16')
const realRequire = createRequire(resolve(root, 'index.js'))

export function loadRecorder(
  options: { spawnError?: Error; loaderError?: Error } = {},
) {
  const children: (EventEmitter & {
    stdout: PassThrough
    stderr: PassThrough
    stdin: PassThrough
    kill: ReturnType<typeof vi.fn>
  })[] = []
  const spawn = vi.fn(() => {
    if (options.spawnError) throw options.spawnError
    const child = Object.assign(new EventEmitter(), {
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      stdin: new PassThrough(),
      kill: vi.fn(() => true),
    })
    children.push(child)
    return child
  })
  const log = vi.fn()
  const cache = new Map<string, { exports: unknown }>()
  const environment = { FIXTURE_ENVIRONMENT: 'recorder-test-data' }
  function load(filename: string): unknown {
    if (!filename.startsWith(root + sep))
      throw new Error('Outside package sandbox')
    if (cache.has(filename)) return cache.get(filename)!.exports
    if (options.loaderError && isLoaderFailure(filename, root))
      throw options.loaderError
    const source = readFileSync(filename, 'utf8')
    const module = { exports: {} as unknown }
    cache.set(filename, module)
    const requireBoundary = (id: string): unknown => {
      if (id === 'child_process') return { spawn }
      if (['assert', 'path', 'debug'].includes(id)) return realRequire(id)
      if (id.startsWith('.') || id.startsWith(root + sep)) {
        const target = resolveRecorderImport(filename, id)
        try {
          return load(target)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT')
            throw Object.assign(new Error(`Missing fixture module: ${id}`), {
              code: 'MODULE_NOT_FOUND',
            })
          throw error
        }
      }
      throw new Error(`Unexpected dependency: ${id}`)
    }
    const wrapper = runInNewContext(
      '(function(require, module, exports, __dirname, process, console) {\n' +
        source +
        '\n})',
      {},
      { filename, timeout: 1000 },
    )
    wrapper(
      requireBoundary,
      module,
      module.exports,
      dirname(filename),
      { env: environment },
      { log },
    )
    return module.exports
  }
  const api = load(resolve(root, 'index.js')) as typeof Public
  return {
    api,
    spawn,
    children,
    log,
    environment,
    loadBuilder: (name: string) =>
      load(resolve(root, 'recorders', name + '.js')) as (
        options: Public.RecordingOptions,
      ) => {
        cmd: string
        args: (string | number)[]
        spawnOptions?: { env?: NodeJS.ProcessEnv }
      },
    cleanup() {
      for (const child of children) {
        child.removeAllListeners()
        for (const stream of [child.stdin, child.stdout, child.stderr]) {
          stream.removeAllListeners()
          stream.destroy()
        }
      }
    },
  }
}
