import { describe, expect, it } from 'vitest'
import { tokens } from '../src/main'
import { pandaTheme } from '../panda.preset'

const theme = pandaTheme.extend.tokens
const spacing = [
  2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 112, 128, 144, 160,
]
const sizes = [12, 14, 16, 18, 24, 28, 32, 36, 42, 48, 54, 60, 68, 76, 84, 92]
const value = (scale: keyof typeof theme, key: number | string) =>
  (theme[scale] as Record<string, { value: unknown }>)[key].value

describe('design tokens consumed by app and UI Panda configurations', () => {
  it.each(spacing.map((pixels, index) => [index + 1, pixels]))(
    'preserves spacing and control size step %i from %i pixels',
    (step, pixels) => {
      expect(tokens.spacing[step as keyof typeof tokens.spacing]).toBe(pixels)
      expect(value('spacing', step)).toBe(`${pixels / 16}rem`)
      expect(value('sizes', step)).toBe(`${pixels / 16}rem`)
    },
  )
  it.each(sizes.map((pixels, index) => [index + 1, pixels]))(
    'preserves typography step %i from %i pixels with unitless leading',
    (step, pixels) => {
      expect(tokens.fontSize[step as keyof typeof tokens.fontSize]).toEqual([
        pixels,
        { lineHeight: 1.4, letterSpacing: 0.32 },
      ])
      expect(value('fontSizes', step)).toBe(`${pixels / 16}rem`)
      expect(value('lineHeights', step)).toBe('1.4')
      expect(value('letterSpacings', step)).toBe('0.02rem')
    },
  )
  it('preserves the raw scales and converts radii and borders without mutation', () => {
    expect(Object.keys(theme.spacing)).toEqual(Object.keys(tokens.spacing))
    expect(Object.keys(theme.fontSizes)).toEqual(Object.keys(tokens.fontSize))
    expect(tokens.borderRadius).toEqual({ xs: 4, sm: 6, md: 8, DEFAULT: 8 })
    expect(tokens.borderWidth).toEqual({ DEFAULT: 1, lg: 4 })
    expect(theme.radii).toEqual({
      xs: { value: '0.25rem' },
      sm: { value: '0.375rem' },
      md: { value: '0.5rem' },
      DEFAULT: { value: '0.5rem' },
    })
    expect(theme.borderWidths).toEqual({
      thin: { value: '1px' },
      thick: { value: '4px' },
    })
  })
  it('provides ordered, CSS-ready fallback font stacks', () => {
    for (const name of ['sans', 'serif', 'mono'] as const) {
      expect(value('fonts', name)).toBe(tokens.fontFamily[name].join(', '))
    }
    expect(value('fonts', 'sans')).toMatch(/^Nunito, system-ui, -apple-system/)
  })
  it('preserves the neutral palette, endpoint aliases, and shadows', () => {
    expect(theme.colors).toMatchObject({
      white: { value: '#ffffff' },
      black: { value: '#0E0E2C' },
      gray: { 30: { value: '#DCDCDC' }, 80: { value: '#444444' } },
    })
    expect(tokens.colors.gray[100]).toBe(tokens.colors.black)
    expect(tokens.colors.gray[0]).toBe(tokens.colors.white)
    expect(value('shadows', 'lg')).toBe(tokens.boxShadow.lg)
    expect(tokens.transition.DEFAULT).toBe('all .3s')
    expect(tokens.motion.visible.transition.duration).toBe(300)
  })
})
