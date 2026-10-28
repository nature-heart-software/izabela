import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { build } from 'vite'
import { generateExportsPlugin } from '../src/main'
import { isSameFilePath } from '../../generate-exports/tests/fs-path'

const directories: string[] = []
afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  )
})
async function tree(files: Record<string, string>) {
  const directory = await fs.mkdtemp(join(tmpdir(), 'vite-exports-'))
  directories.push(directory)
  for (const [file, text] of Object.entries(files)) {
    await fs.mkdir(dirname(join(directory, file)), { recursive: true })
    await fs.writeFile(join(directory, file), text)
  }
  return directory
}
async function barrel(file: string) {
  let text = ''
  await vi.waitFor(
    async () => {
      text = await fs.readFile(file, 'utf8')
      expect(text).toContain('/* End of auto-generated content. */')
    },
    { timeout: 4000, interval: 20 },
  )
  return text.split('\n').filter((line) => line.startsWith('export '))
}

it('generates real barrels during an actual Vite build without changing application output', async () => {
  const root = await tree({
    'entry.js': 'export const value = 42',
    'source/z.ts': '',
    'source/a.ts': '',
    'source/a.spec.ts': '',
    'source/index.ts': 'stale',
  })
  const plugin = generateExportsPlugin({
    entries: [
      {
        directories: [join(root, 'source')],
        include: ['*.ts'],
        exclude: ['*.spec.ts'],
        filename: 'index.ts',
      },
    ],
  })
  const output = await build({
    root,
    configFile: false,
    envFile: false,
    logLevel: 'silent',
    plugins: [plugin],
    build: {
      write: false,
      lib: { entry: join(root, 'entry.js'), formats: ['es'] },
    },
  })
  expect(Array.isArray(output)).toBe(true)
  expect((output as any[])[0].output[0].code).toContain('42')
  expect(await barrel(join(root, 'source/index.ts'))).toEqual([
    "export { default as a } from './a';",
    "export { default as z } from './z';",
  ])
})

it('forwards directory overrides, formatting, nested globs, empty entries and repeated starts', async () => {
  const root = await tree({
    'a/nested/alpha.ts': '',
    'a/private.ts': '',
    'b/beta.ts': '',
  })
  const plugin = generateExportsPlugin({
    entries: [
      {
        directories: [
          [
            join(root, 'a'),
            {
              filename: 'custom.ts',
              singleQuote: false,
              omitSemi: true,
              omitExtension: false,
              exportAll: true,
              exportAllAsAlias: false,
            },
          ],
          join(root, 'b'),
        ],
        include: ['**/*.ts'],
        exclude: ['private.ts'],
        filename: 'index.ts',
      },
    ],
  })
  expect(plugin.buildStart()).toBeUndefined()
  expect(await barrel(join(root, 'a/custom.ts'))).toEqual([
    'export * from "./nested/alpha.ts"',
  ])
  expect(await barrel(join(root, 'b/index.ts'))).toEqual([
    "export { default as beta } from './beta';",
  ])
  plugin.buildStart()
  expect(await barrel(join(root, 'b/index.ts'))).toHaveLength(1)
  expect(generateExportsPlugin({ entries: [] }).buildStart()).toBeUndefined()
})

it('characterizes fire-and-forget filesystem failures leaving a blocked output directory intact', async () => {
  const root = await tree({ 'alpha.ts': '' })
  const output = join(root, 'index.js')
  await fs.mkdir(output)
  const read = vi.spyOn(fs, 'readFile')
  const plugin = generateExportsPlugin({
    entries: [{ directories: [root], include: ['*.ts'] }],
  })
  expect(plugin.buildStart()).toBeUndefined()
  await vi.waitFor(() =>
    expect(read.mock.calls.some(([file]) => isSameFilePath(file, output))).toBe(
      true,
    ),
  )
  await Promise.allSettled(read.mock.results.map(({ value }) => value))
  await new Promise(setImmediate)
  expect((await fs.stat(output)).isDirectory()).toBe(true)
  expect(await fs.readdir(output)).toEqual([])
})

it('rejects malformed required configuration synchronously in the actual generator', () => {
  expect(() => generateExportsPlugin(undefined as never)).toThrow(TypeError)
  expect(() => generateExportsPlugin({} as never)).toThrow(TypeError)
})
