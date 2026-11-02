import { rem, rgba } from 'polished'
import { tokens } from '@/styles/tokens'
import { CSSObject } from '@/types/css-in-js'

const { borderRadius, spacing } = tokens
export const sizeValues = ['xs', 'sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

type Value = number | string
type FontSizeProperty = 'lineHeight' | 'letterSpacing'
type FontSizeToken =
  | Value
  | [Value, Record<FontSizeProperty, Value>]
  | readonly [Value, Record<FontSizeProperty, Value>]

export const fontSize = (fontSizeToken: FontSizeToken) =>
  typeof fontSizeToken === 'number' || typeof fontSizeToken === 'string'
    ? rem(fontSizeToken)
    : rem(fontSizeToken[0])

export const lineHeight = (fontSizeToken: FontSizeToken) =>
  // eslint-disable-next-line no-nested-ternary
  typeof fontSizeToken === 'number' || typeof fontSizeToken === 'string'
    ? 1
    : typeof fontSizeToken[1]?.lineHeight === 'string'
    ? rem(fontSizeToken[1]?.lineHeight)
    : fontSizeToken[1]?.lineHeight || 1

export const letterSpacing = (fontSizeToken: FontSizeToken) =>
  typeof fontSizeToken === 'number' || typeof fontSizeToken === 'string'
    ? 'normal'
    : rem(fontSizeToken[1]?.letterSpacing) || 'normal'

export const fontSizeStyle = (fontSizeToken: FontSizeToken) => ({
  fontSize: fontSize(fontSizeToken),
  lineHeight: lineHeight(fontSizeToken),
  letterSpacing: letterSpacing(fontSizeToken),
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

export function disabledItemBackgroundStyle({ theme }: any) {
  return `
    background-color: ${rgba(
      theme.disabledItemBackground.backdropColor,
      theme.disabledItemBackground.backdropOpacity,
    )};
  `
}
