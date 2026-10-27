import { build } from 'vite'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const boundary = vi.hoisted(() => ({ start: vi.fn(), generate: vi.fn() }))
vi.mock('@packages/generate-exports', () => ({
  generateExports: boundary.generate,
}))
import { generateExportsPlugin } from '../src/main'

beforeEach(() => {
  boundary.start.mockReset()
  boundary.generate
    .mockReset()
    .mockImplementation(() => ({ start: boundary.start }))
})

// Use Vite's own resolution/load pipeline, not a replica of its hooks.
const virtualEntry = {
  name: 'entry',
  resolveId(id: string) {
    if (id === 'virtual:entry') return id
  },
  load(id: string) {
    if (id === 'virtual:entry') return 'export const value = 1'
  },
}
const viteBuild = (plugin: ReturnType<typeof generateExportsPlugin>) =>
  build({
    configFile: false,
    envFile: false,
    logLevel: 'silent',
    plugins: [virtualEntry, plugin],
    build: { write: false, rollupOptions: { input: 'virtual:entry' } },
  })

describe('Vite generator delegation', () => {
  it('constructs one generator with the exact options and defers start until buildStart', () => {
    const options = {
      watch: true,
      entries: [
        {
          directories: [
            ['src', { filename: 'barrel.ts' }] as [
              string,
              { filename: string },
            ],
          ],
          include: ['*.ts'],
          exclude: ['*.spec.ts'],
        },
      ],
    }
    const plugin = generateExportsPlugin(options)
    expect(boundary.generate).toHaveBeenCalledExactlyOnceWith(options)
    expect(boundary.generate.mock.calls[0][0]).toBe(options)
    expect(boundary.start).not.toHaveBeenCalled()
    expect(plugin.name).toBe('generate-exports')
    expect(Object.keys(plugin).sort()).toEqual(['buildStart', 'name'])
    expect(plugin.buildStart()).toBeUndefined()
    expect(boundary.start).toHaveBeenCalledOnce()
  })

  it('Vite invokes the actual hook once per build while reusing its generator', async () => {
    const plugin = generateExportsPlugin({ entries: [] })
    await viteBuild(plugin)
    await viteBuild(plugin)
    expect(boundary.generate).toHaveBeenCalledOnce()
    expect(boundary.start).toHaveBeenCalledTimes(2)
  })

  it('propagates synchronous start failures through the Vite lifecycle', async () => {
    boundary.start.mockImplementationOnce(() => {
      throw new Error('generator start failed')
    })
    await expect(
      viteBuild(generateExportsPlugin({ entries: [] })),
    ).rejects.toThrow('generator start failed')
  })

  it('propagates construction errors rather than returning a broken plugin', () => {
    boundary.generate.mockImplementationOnce(() => {
      throw new TypeError('invalid generator options')
    })
    expect(() => generateExportsPlugin({ entries: [] })).toThrow(
      'invalid generator options',
    )
    expect(boundary.start).not.toHaveBeenCalled()
  })
})
