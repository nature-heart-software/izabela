import { describe, expect, it } from 'vitest'
import { tailwindTheme, tokens } from '../src/main'

const spacing = [
  2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 112, 128, 144, 160,
]
const sizes = [12, 14, 16, 18, 24, 28, 32, 36, 42, 48, 54, 60, 68, 76, 84, 92]

describe('design tokens consumed as a Tailwind theme', () => {
  it.each(spacing.map((pixels, index) => [index + 1, pixels]))(
    'converts spacing step %i from %i pixels to rem',
    (step, pixels) => {
      expect(tokens.spacing[step as keyof typeof tokens.spacing]).toBe(pixels)
      expect(tailwindTheme.spacing[step as keyof typeof tokens.spacing]).toBe(
        `${pixels / 16}rem`,
      )
    },
  )

  it.each(sizes.map((pixels, index) => [index + 1, pixels]))(
    'converts font step %i from %i pixels with unitless leading',
    (step, pixels) => {
      expect(tokens.fontSize[step as keyof typeof tokens.fontSize]).toEqual([
        pixels,
        { lineHeight: 1.4, letterSpacing: 0.32 },
      ])
      expect(
        tailwindTheme.fontSize[step as keyof typeof tokens.fontSize],
      ).toEqual([
        `${pixels / 16}rem`,
        { lineHeight: 1.4, letterSpacing: '0.02rem' },
      ])
    },
  )

  it('retains every scale key without mutating the raw pixel scales', () => {
    for (const scale of [
      'spacing',
      'fontSize',
      'borderRadius',
      'borderWidth',
    ] as const) {
      expect(Object.keys(tailwindTheme[scale])).toEqual(
        Object.keys(tokens[scale]),
      )
      expect(tailwindTheme[scale]).not.toBe(tokens[scale])
    }
    expect(tokens.borderRadius).toEqual({ xs: 4, sm: 6, md: 8, DEFAULT: 8 })
    expect(tokens.borderWidth).toEqual({ DEFAULT: 1, lg: 4 })
    expect(tailwindTheme.borderRadius).toEqual({
      xs: '0.25rem',
      sm: '0.375rem',
      md: '0.5rem',
      DEFAULT: '0.5rem',
    })
    expect(tailwindTheme.borderWidth).toEqual({
      DEFAULT: '0.0625rem',
      lg: '0.25rem',
    })
  })

  it('provides ordered, CSS-ready fallback font stacks', () => {
    expect(tokens.fontFamily.sans.join(', ')).toBe(
      'Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    )
    expect(tokens.fontFamily.serif.join(', ')).toBe(
      'Georgia, Cambria, "Times New Roman", Times, serif',
    )
    expect(tokens.fontFamily.mono.join(', ')).toBe(
      'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    )
    expect(tailwindTheme.fontFamily).toBe(tokens.fontFamily)
  })

  it('keeps the complete neutral palette and its endpoint aliases', () => {
    expect(tailwindTheme.colors).toBe(tokens.colors)
    expect(tailwindTheme.colors).toEqual({
      white: '#ffffff',
      black: '#0E0E2C',
      gray: {
        100: '#0E0E2C',
        90: '#2B2B2C',
        80: '#444444',
        70: '#626262',
        60: '#818181',
        50: '#9F9F9F',
        40: '#BEBEBE',
        30: '#DCDCDC',
        20: '#EBEBEB',
        10: '#F9F9FC',
        0: '#ffffff',
      },
    })
    expect(tokens.colors.gray[100]).toBe(tokens.colors.black)
    expect(tokens.colors.gray[0]).toBe(tokens.colors.white)
  })

  it('preserves shadows, transition strings and millisecond motion durations without rem conversion', () => {
    expect(tailwindTheme.boxShadow).toEqual({
      DEFAULT: '0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)',
      lg: '0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)',
    })
    expect(tailwindTheme.transition).toEqual({ DEFAULT: 'all .3s' })
    expect(tailwindTheme.motion).toEqual({
      visible: { opacity: 1, transition: { duration: 300 } },
      hidden: { opacity: 0, transition: { duration: 300 } },
    })
    expect(tailwindTheme.motion).toBe(tokens.motion)
  })

  it('can compose a CSS declaration from converted consumer values', () => {
    const [fontSize, { lineHeight, letterSpacing }] = tailwindTheme.fontSize[3]
    expect(
      `padding: ${tailwindTheme.spacing[5]}; border: ${tailwindTheme.borderWidth.DEFAULT} solid ${tailwindTheme.colors.gray[30]}; font-size: ${fontSize}; line-height: ${lineHeight}; letter-spacing: ${letterSpacing};`,
    ).toBe(
      'padding: 1rem; border: 0.0625rem solid #DCDCDC; font-size: 1rem; line-height: 1.4; letter-spacing: 0.02rem;',
    )
  })
})
