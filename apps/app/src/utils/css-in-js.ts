import { rem } from 'polished'
import tokens from '@/styles/tokens'
import { CSSObject } from '@/types/css-in-js'

const { borderRadius, spacing } = tokens
export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

type Value = number | string
type FontSizeProperty = 'lineHeight' | 'letterSpacing'
type TailwindFontSize =
  | Value
  | [Value, Record<FontSizeProperty, Value>]
  | readonly [Value, Record<FontSizeProperty, Value>]

export const fontSize = (tailwindFontSize: TailwindFontSize) =>
  typeof tailwindFontSize === 'number' || typeof tailwindFontSize === 'string'
    ? rem(tailwindFontSize)
    : rem(tailwindFontSize[0])

export const lineHeight = (tailwindFontSize: TailwindFontSize) =>
  // eslint-disable-next-line no-nested-ternary
  typeof tailwindFontSize === 'number' || typeof tailwindFontSize === 'string'
    ? 1
    : typeof tailwindFontSize[1]?.lineHeight === 'string'
    ? rem(tailwindFontSize[1]?.lineHeight)
    : tailwindFontSize[1]?.lineHeight || 1

export const letterSpacing = (tailwindFontSize: TailwindFontSize) =>
  typeof tailwindFontSize === 'number' || typeof tailwindFontSize === 'string'
    ? 'normal'
    : rem(tailwindFontSize[1]?.letterSpacing) || 'normal'

export const fontSizeStyle = (tailwindFontSize: TailwindFontSize) => ({
  fontSize: fontSize(tailwindFontSize),
  lineHeight: lineHeight(tailwindFontSize),
  letterSpacing: letterSpacing(tailwindFontSize),
})

export const borderRadiusStyleBySize = (size: string) => ({
  borderRadius: rem(borderRadius[size as keyof typeof borderRadius] || borderRadius.DEFAULT),
})

export const horizontalPaddingStyleBySize = (size: Size) => {
  const styles: Record<Size, CSSObject> = {
    sm: {
      paddingLeft: rem(spacing['3']),
      paddingRight: rem(spacing['3']),
    },
    md: {
      paddingLeft: rem(spacing['5']),
      paddingRight: rem(spacing['5']),
    },
    lg: {
      paddingLeft: rem(spacing['5']),
      paddingRight: rem(spacing['5']),
    },
  }
  return styles[size]
}

export const horizontalPaddingWithIconStyleBySize = (size: Size) => {
  const styles: Record<Size, CSSObject> = {
    sm: {
      paddingLeft: rem(spacing['3']),
      paddingRight: rem(spacing['3'] + spacing['5']),
    },
    md: {
      paddingLeft: rem(spacing['5']),
      paddingRight: rem(spacing['5'] + spacing['5']),
    },
    lg: {
      paddingLeft: rem(spacing['6']),
      paddingRight: rem(spacing['6'] + spacing['5']),
    },
  }
  return styles[size]
}

export const iconStyleBySize = (size: Size) => {
  const styles: Record<Size, CSSObject> = {
    sm: {
      right: `${rem(spacing['2'])}`,
    },
    md: {
      right: `${rem(spacing['2'])}`,
    },
    lg: {
      right: `${rem(spacing['3'])}`,
    },
  }
  return styles[size]
}
