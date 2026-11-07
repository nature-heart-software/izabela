import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { posix, win32 } from 'node:path'

describe('compiled component virtual entries', () => {
  it.each([
    ['display-migration.spec.ts', 'display-client'],
    ['style-boundaries.spec.ts', 'style-boundaries-client'],
  ])('%s resolves native and normalized entry paths', (file, entry) => {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    const method = source.match(/resolveId\(id\) \{[^\n]+\}/)?.[0]
    expect(method).toBeDefined()
    // Exercise the resolver embedded in the real child-build configuration.
    const plugin = runInNewContext(`({ ${method} })`, { win32 })
    expect(plugin.resolveId(entry)).toBe(entry)
    expect(plugin.resolveId(posix.join('/workspace/packages/ui', entry))).toBe(
      entry,
    )
    expect(
      plugin.resolveId(win32.join('D:\\workspace\\packages\\ui', entry)),
    ).toBe(entry)
    expect(plugin.resolveId(`${entry}-other`)).toBeUndefined()
  })
})
