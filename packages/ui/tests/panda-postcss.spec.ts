import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const viteRequire = createRequire(require.resolve('vite/package.json'))
const loadConfig = viteRequire('postcss-load-config')

describe('live Panda stylesheet integration', () => {
  it('extracts component styles through the normal PostCSS pipeline and registers watch dependencies', async () => {
    const { plugins, options } = await loadConfig({}, root)
    const result = await postcss(plugins).process(
      '@layer reset, panda_base, tokens, recipes, panda_utilities;',
      {
        ...options,
        from: resolve(root, 'src/styles/panda.css'),
      },
    )
    expect(result.css).toContain('--nv-text-color')
    expect(result.css).toContain('--font-sizes-2')
    expect(
      result.messages.some((message) => message.type === 'dir-dependency'),
    ).toBe(true)
  })
})
