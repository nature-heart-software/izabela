import { rem } from 'polished'

type TailwindFontSize =
  | number
  | [number, Record<'lineHeight' | 'letterSpacing', number>]
  | readonly [number, Record<'lineHeight' | 'letterSpacing', number>]

export const fontSize = (tailwindFontSize: TailwindFontSize) =>
  typeof tailwindFontSize === 'number' ? rem(tailwindFontSize) : rem(tailwindFontSize[0])

export const lineHeight = (tailwindFontSize: TailwindFontSize) =>
  typeof tailwindFontSize === 'number' ? 1 : rem(tailwindFontSize[1]?.lineHeight) || 1

export const letterSpacing = (tailwindFontSize: TailwindFontSize) =>
  typeof tailwindFontSize === 'number'
    ? 'normal'
    : rem(tailwindFontSize[1]?.letterSpacing) || 'normal'

export const fontSizeStyle = (tailwindFontSize: TailwindFontSize) => ({
  fontSize: fontSize(tailwindFontSize),
  lineHeight: lineHeight(tailwindFontSize),
  letterSpacing: letterSpacing(tailwindFontSize),
})
