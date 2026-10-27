import { resetBoundaries } from './boundaries'
import { harness, request } from './http'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { Readable } from 'node:stream'
import { setImmediate } from 'node:timers/promises'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleError } from '../src/utils/requests'

describe('Google malformed response stream lifecycle', () => {
  let errors: Error[]
  let response: Awaited<ReturnType<typeof request>>
  beforeEach(async () => {
    resetBoundaries()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    errors = []
    // Observe errors on the genuine Readable without changing its pipe/read lifecycle.
    class ObservedReadable extends Readable {
      constructor(options?: import('node:stream').ReadableOptions) {
        super(options)
        this.on('error', (error) => errors.push(error))
      }
    }
    const file = new URL('../src/plugins/speech-apis/gc.ts', import.meta.url)
    const source = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText
    const exports = {} as { default: Izabela.Server.Plugin }
    runInNewContext(source, {
      exports,
      Buffer,
      require(id: string) {
        if (id === 'axios')
          return { post: async () => ({ data: { audioContent: null } }) }
        if (id === '../../utils/requests') return { handleError }
        if (id === 'stream') return { Readable: ObservedReadable }
        throw new Error(`Unexpected require: ${id}`)
      },
    })
    response = await request(
      harness(exports.default, tmpdir()).app,
      '/api/tts/google-cloud/synthesize-speech',
      { credentials: { apiKey: 'fixture-key' }, payload: { audioConfig: {} } },
    )
    await setImmediate()
  })
  it('characterizes handled Buffer error plus secondary unhandled _read error after piping', () => {
    expect(response.status).toBe(500)
    expect(response.json().error).toContain('first argument')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      code: 'ERR_METHOD_NOT_IMPLEMENTED',
      message: 'The _read() method is not implemented',
    })
  })
  it.fails(
    '[known issue] malformed Google audio should not leave a Readable emitting an unhandled error',
    () => {
      expect(errors).toEqual([])
    },
  )
})
