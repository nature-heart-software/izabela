import { describe, expect, it } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
function processStyles(packageRoot: string, name: string) {
  const output = resolve(root, `../../coverage/panda-postcss-${name}.json`)
  execFileSync(
    process.execPath,
    [resolve(root, 'tests/process-styles.mjs'), packageRoot, output],
    { stdio: 'pipe' },
  )
  return JSON.parse(readFileSync(output, 'utf8')) as {
    css: string
    hasWatchDependencies: boolean
  }
}

describe('live Panda stylesheet integration', () => {
  it('extracts app layouts and overrides above shared UI styles with a layered reset', async () => {
    const appRoot = resolve(root, '../../apps/app')
    const result = processStyles(appRoot, 'app')
    expect(result.css).toContain('panda_utilities, app_utilities')
    expect(result.css).toContain('@layer app_utilities')
    expect(result.css).toContain('.app-w_768px')
    expect(result.css).not.toMatch(/\s\.px_3\s*\{/)
    expect(result.css).toContain('grid-template-rows: none')
    expect(result.css).toContain('margin-top: var(--spacing-4)')
    expect(result.css).toContain('user-select: text')
    const selectionDefaults: string[] = []
    postcss.parse(result.css).walkDecls('user-select', (decl) => {
      if (decl.value !== 'none') return
      const layer = decl.parent?.parent
      selectionDefaults.push(
        layer?.type === 'atrule' ? layer.params : 'unlayered',
      )
    })
    expect(selectionDefaults).toEqual(['panda_base'])
    expect(result.css).toContain('flex: 1 1 0% !important')
    expect(result.css).toContain('--fonts-sans: Nunito')
    const resets: string[] = []
    postcss.parse(result.css).walkRules((rule) => {
      if (!rule.selector.includes('::before')) return
      rule.walkDecls('box-sizing', () => {
        const layer = rule.parent
        resets.push(layer?.type === 'atrule' ? layer.params : 'unlayered')
      })
    })
    expect(resets).toContain('reset')
    expect(resets).not.toContain('unlayered')
    expect(result.hasWatchDependencies).toBe(true)
  })
  it('extracts shared component styles and registers watch dependencies', async () => {
    const result = processStyles(root, 'ui')
    expect(result.css).toContain('--nv-text-color')
    expect(result.css).toContain('--font-sizes-2')
    expect(result.css).toContain('@layer reset')
    expect(result.hasWatchDependencies).toBe(true)
  })
})
