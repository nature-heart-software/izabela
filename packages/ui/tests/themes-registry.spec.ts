import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { compileVariables } from '../../design-tokens/tools/figma-import.mjs'
vi.mock('@/styles/tokens', () => import('../../design-tokens/src/main'))
import generated from '../../design-tokens/src/figma.generated.json'
import * as registry from '../src/themes'

const api = registry as typeof registry & {
  themeOptions: Array<{ value: string; label: string }>
  resolveTheme: (id: string) => Record<string, any>
}

describe('imported theme registry', () => {
  it('keeps future canonical Light/Dark modes reachable ahead of legacy aliases', () => {
    const snapshot = JSON.parse(
      readFileSync(
        new URL('../../design-tokens/figma/variables.json', import.meta.url),
        'utf8',
      ),
    )
    const semantic = snapshot.collections.find(
      ({ name }) => name === 'Semantic Tokens',
    )
    for (const name of ['Light', 'Dark']) {
      const from = semantic.modes.find(
        (mode) => mode.name === `GitHub ${name}`,
      ).modeId
      const modeId = `future-${name.toLowerCase()}`
      semantic.modes.push({ modeId, name })
      for (const variable of snapshot.variables.filter(
        ({ variableCollectionId }) => variableCollectionId === semantic.id,
      )) {
        variable.valuesByMode[modeId] = structuredClone(
          variable.valuesByMode[from],
        )
      }
    }
    const imported = compileVariables(snapshot, snapshot)
    const loadTypescript = createRequire(import.meta.url)(
      '../../../tests/load-typescript.cjs',
    )
    const future = loadTypescript(
      fileURLToPath(new URL('../src/themes/index.ts', import.meta.url)),
      { '../../../design-tokens/src/figma.generated.json': imported },
    )
    for (const id of ['light', 'dark']) {
      const entry = imported.themes.find((theme) => theme.id === id)
      expect(future.themeOptions).toContainEqual({
        value: id,
        label: entry.label,
      })
      expect(future.resolveThemeId(id)).toBe(id)
      expect(future.resolveTheme(id)).toBe(future.themes.get(id))
      expect(future.resolveTheme(id)).toEqual(entry.values)
      expect(future.resolveTheme(id).tooltip.default.background).not.toBe(
        future.themes.get(`izabela-${id}`).tooltip.default.background,
      )
    }
  })
  it('resolves compatibility selections to generated option IDs with the same fallback as theme values', () => {
    for (const [saved, expected] of [
      ['light', 'izabela-light'],
      ['dark', 'izabela-dark'],
      ['removed-theme', generated.defaultThemeId],
      ...generated.themes.map(({ id }) => [id, id]),
    ]) {
      expect(registry.resolveThemeId(saved)).toBe(expected)
      expect(
        api.themeOptions.some(
          ({ value }) => value === registry.resolveThemeId(saved),
        ),
      ).toBe(true)
      expect(api.resolveTheme(saved)).toBe(api.themes.get(expected))
    }
  })
  it('exposes every source mode without a light/dark allowlist', () => {
    expect(api.themeOptions).toEqual(
      generated.themes.map(({ id, label }) => ({ value: id, label })),
    )
    for (const entry of generated.themes) {
      expect(api.themes.get(entry.id)).toEqual(entry.values)
      expect(api.resolveTheme(entry.id)).toEqual(entry.values)
    }
  })
  it('keeps persisted light/dark selections usable without legacy token aliases', () => {
    expect(api.resolveTheme('light')).toEqual(
      generated.themes.find(({ id }) => id === 'izabela-light')!.values,
    )
    expect(api.resolveTheme('dark')).toEqual(
      generated.themes.find(({ id }) => id === 'izabela-dark')!.values,
    )
    expect(api.resolveTheme('dark')).not.toHaveProperty('text.color')
    expect(api.resolveTheme('dark')).toHaveProperty('text.body.foreground')
    expect(api.resolveTheme('removed-theme')).toEqual(
      generated.themes[0].values,
    )
  })
})
