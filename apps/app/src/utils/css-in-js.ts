type TailwindFontSize =
  | string
  | [string, Record<'lineHeight' | 'letterSpacing', string>]
  | readonly [string, Record<'lineHeight' | 'letterSpacing', string>]

export const fontSize = (tailwindFontSize: TailwindFontSize) =>
  typeof tailwindFontSize === 'string' ? 'string' : tailwindFontSize[0]

export const lineHeight = (tailwindFontSize: TailwindFontSize) =>
  typeof tailwindFontSize === 'string' ? '1' : tailwindFontSize[1]?.lineHeight || '1'

export const letterSpacing = (tailwindFontSize: TailwindFontSize) =>
  typeof tailwindFontSize === 'string' ? 'normal' : tailwindFontSize[1]?.letterSpacing || 'normal'

export const fontSizeStyle = (tailwindFontSize: TailwindFontSize) => ({
  fontSize: fontSize(tailwindFontSize),
  lineHeight: lineHeight(tailwindFontSize),
  letterSpacing: letterSpacing(tailwindFontSize),
})
