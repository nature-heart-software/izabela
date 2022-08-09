import { rem, rgba } from 'polished'
import { tokens } from '@izabela/ui'
import { CSSObject } from '@/types/css-in-js'

const { borderRadius, spacing } = tokens
export const sizeValues = ['xs', 'sm', 'md', 'lg'] as const
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

export function borderRadiusStyleBySize(size: Size) {
  const styles: Record<Size, CSSObject> = {
    xs: {
      borderRadius: rem(borderRadius.xs),
    },
    sm: {
      borderRadius: rem(borderRadius.sm),
    },
    md: {
      borderRadius: rem(borderRadius.md),
    },
    lg: {
      borderRadius: rem(borderRadius.DEFAULT),
    },
  }
  return styles[size]
}

export function paddingStyleBySize(size: Size) {
  const styles: Record<Size, CSSObject> = {
    xs: {
      paddingTop: rem(spacing['2']),
      paddingLeft: rem(spacing['2']),
      paddingRight: rem(spacing['2']),
      paddingBottom: rem(spacing['2']),
    },
    sm: {
      paddingTop: rem(spacing['3']),
      paddingLeft: rem(spacing['3']),
      paddingRight: rem(spacing['3']),
      paddingBottom: rem(spacing['3']),
    },
    md: {
      paddingTop: rem(spacing['5']),
      paddingLeft: rem(spacing['5']),
      paddingRight: rem(spacing['5']),
      paddingBottom: rem(spacing['5']),
    },
    lg: {
      paddingTop: rem(spacing['5']),
      paddingLeft: rem(spacing['5']),
      paddingRight: rem(spacing['5']),
      paddingBottom: rem(spacing['5']),
    },
  }
  return styles[size]
}

export function horizontalPaddingStyleBySize(size: Size) {
  const styles: Record<Size, CSSObject> = {
    xs: {
      paddingLeft: rem(spacing['2']),
      paddingRight: rem(spacing['2']),
    },
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

export function horizontalPaddingWithIconStyleBySize(size: Size) {
  const styles: Record<Size, CSSObject> = {
    xs: {
      paddingLeft: rem(spacing['2']),
      paddingRight: rem(spacing['2'] + spacing['4']),
    },
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

export function iconStyleBySize(size: Size) {
  const styles: Record<Size, CSSObject> = {
    xs: {
      right: `${rem(spacing['1'])}`,
    },
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

export function disabledItemBackgroundStyle() {
  return `
    background-color: ${rgba('#fff', 0.9)};
  `
}
