import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, win32 } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { expect, it } from 'vitest'
import { createUiParsedCommandLine } from './vue-config.mjs'

it('writes official Vue helpers at the repository root for a Windows config filename', () => {
  const require = createRequire(import.meta.url)
  const processorRequire = createRequire(require.resolve('vite-plugin-dts'))
  const { createGlobalTypesWriter } = processorRequire('@vue/language-core')
  const repository = fileURLToPath(new URL('../../../', import.meta.url))
  const windowsRoot = 'D:\\a\\izabela\\izabela'
  const configFileName = win32.join(
    windowsRoot,
    'packages/ui/tests/tsconfig.build.json',
  )
  // Read the real repository configs through a Windows-shaped, read-only host.
  // No Windows drive access or physical helper writes occur on any platform.
  const localPath = (filename: string) => {
    const relative = win32.relative(windowsRoot, filename)
    if (relative.startsWith('..') || win32.isAbsolute(relative))
      return undefined
    return join(repository, ...relative.split(/[\\/]/))
  }
  const host = {
    ...ts.sys,
    getCurrentDirectory: () => win32.join(windowsRoot, 'packages/ui'),
    readDirectory: () => [],
    fileExists: (filename: string) => {
      const local = localPath(filename)
      return local !== undefined && existsSync(local)
    },
    readFile: (filename: string) => {
      const local = localPath(filename)
      return local !== undefined && existsSync(local)
        ? readFileSync(local, 'utf8')
        : undefined
    },
    writeFile: () => {
      throw new Error('Virtual config host must remain read-only')
    },
  }
  const { vueOptions } = createUiParsedCommandLine(ts, host, configFileName)
  const writes: { filename: string; content: string }[] = []
  createGlobalTypesWriter(vueOptions, (filename: string, content: string) => {
    writes.push({ filename, content })
  })(win32.join(windowsRoot, 'packages/ui/src/main.ts').replace(/\\/g, '/'))
  expect(writes).toHaveLength(1)
  expect(writes[0].filename).toBe(
    'D:/a/izabela/izabela/coverage/ui-types/vue-global-types.d.ts',
  )
  expect(writes[0].content).toContain('__VLS_')
})
