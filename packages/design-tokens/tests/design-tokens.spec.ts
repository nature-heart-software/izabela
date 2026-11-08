import { describe, expect, it } from 'vitest'
import generated from '../src/figma.generated.json'
import { tokens } from '../src/main'
import { pandaTheme } from '../panda.preset'

const theme = pandaTheme.extend.tokens
const value = (scale: keyof typeof theme, key: number | string) =>
  (theme[scale] as Record<string, { value: unknown }>)[key].value

describe('Figma-authored primitive tokens', () => {
  it('exports the exact primitive structure instead of maintaining a second token schema', () => {
    expect(tokens).toEqual(generated.primitives)
    expect(tokens).not.toHaveProperty('borderRadius')
    expect(tokens).not.toHaveProperty('boxShadow')
  })
  it('converts every spacing and size step from source pixels to rem', () => {
    for (const [step, pixels] of Object.entries(generated.primitives.spacing)) {
      expect(value('spacing', step)).toBe(`${pixels / 16}rem`)
      expect(value('sizes', step)).toBe(`${pixels / 16}rem`)
    }
  })
  it('retains authored typography values and units without tuple adapters', () => {
    for (const [step, pixels] of Object.entries(generated.primitives.fontSize))
      expect(value('fontSizes', step)).toBe(`${pixels / 16}rem`)
    expect(value('lineHeights', 'default')).toBe(
      String(generated.primitives.lineHeight.default),
    )
    expect(value('letterSpacings', 'default')).toBe(
      `${generated.primitives.letterSpacing.default / 16}rem`,
    )
    expect(value('fonts', 'sans')).toBe(generated.primitives.fontFamily.sans)
  })
  it('registers authored radius and border names with no renamed legacy leaves', () => {
    for (const [name, pixels] of Object.entries(generated.primitives.radius))
      expect(value('radii', name)).toBe(`${pixels / 16}rem`)
    for (const [name, pixels] of Object.entries(generated.primitives.border))
      expect(value('borderWidths', name)).toBe(`${pixels}px`)
    expect(theme.borderWidths).not.toHaveProperty('thin')
  })
  it('registers semantic paths in Panda without rewriting space-containing palette groups', () => {
    expect(pandaTheme.extend.semanticTokens).toMatchObject(
      generated.semanticTokens,
    )
    expect(theme.colors).toEqual({})
    expect(generated.themes[0].values).toHaveProperty('Kumo Ink.Light.canvas')
    expect(generated.paletteTokens.colors).toHaveProperty(
      'Kumo Ink.Light.canvas',
    )
  })
})
