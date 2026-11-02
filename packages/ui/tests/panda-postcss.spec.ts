import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { readFileSync } from 'node:fs'
import { compileString } from 'sass'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const viteRequire = createRequire(require.resolve('vite/package.json'))
const loadConfig = viteRequire('postcss-load-config')

describe('live Panda stylesheet integration', () => {
  it('keeps the app reset from overriding shared UI control styles', async () => {
    const appRoot = resolve(root, '../../apps/app')
    const { plugins, options } = await loadConfig({}, appRoot)
    const source = compileString(
      readFileSync(resolve(appRoot, 'src/styles/main.scss'), 'utf8'),
    ).css
    const tailwindConfig = require(resolve(appRoot, 'tailwind.config.js'))
    const appPlugins = plugins.map((plugin: any) =>
      plugin === require('tailwindcss') ||
      plugin.postcssPlugin === 'tailwindcss'
        ? require('tailwindcss')({
            ...tailwindConfig,
            content: tailwindConfig.content.map((pattern: string) =>
              resolve(appRoot, pattern),
            ),
          })
        : plugin,
    )
    const result = await postcss(appPlugins).process(source, {
      ...options,
      from: resolve(appRoot, 'src/styles/main.scss'),
    })
    const controlReset: string[] = []
    result.root.walkRules((rule) => {
      if (!rule.selector.includes('button')) return
      rule.walkDecls('background-color', (decl) => {
        if (decl.value !== 'transparent') return
        let parent = rule.parent
        while (parent && parent.type !== 'root') {
          if (parent.type === 'atrule' && parent.name === 'layer') {
            controlReset.push(parent.params)
            return
          }
          parent = parent.parent
        }
        controlReset.push('unlayered')
      })
    })
    expect(controlReset).toContain('reset')
    expect(controlReset).not.toContain('unlayered')
    expect(result.css).toContain('.w-full')
  })

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
