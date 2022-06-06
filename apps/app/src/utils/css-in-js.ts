import { rem } from 'polished'
import tokens from '@/styles/tokens'

const { borderRadius } = tokens

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

export const borderRadiusBySizeStyle = (size: string) => ({
  borderRadius: rem(borderRadius[size as keyof typeof borderRadius] || borderRadius.DEFAULT),
})
