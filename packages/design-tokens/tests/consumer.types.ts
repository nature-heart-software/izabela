import { tokens, tailwindTheme } from '..'

type IsAny<T> = 0 extends 1 & T ? true : false
type Assert<T extends true> = T
type NotAny<T> = IsAny<T> extends true ? false : true
type SpacingIsTyped = Assert<NotAny<typeof tailwindTheme.spacing[1]>>
type FontSizeIsTyped = Assert<NotAny<typeof tailwindTheme.fontSize[3]>>
const spacing: string = tailwindTheme.spacing[1]
const [size, options] = tailwindTheme.fontSize[3]
const sizeText: string = size
const leading: 1.4 = options.lineHeight
const tracking: string = options.letterSpacing
const raw: 16 = tokens.fontSize[3][0]
const radius: string = tailwindTheme.borderRadius.DEFAULT
const width: string = tailwindTheme.borderWidth.lg
// @ts-expect-error raw tokens are readonly
tokens.spacing[1] = 3
// @ts-expect-error only declared spacing keys are available
tailwindTheme.spacing[99]
// @ts-expect-error font options are not strings
const invalidOptions: string = options
// @ts-expect-error rem dimensions are not numbers
const invalidRadius: number = tailwindTheme.borderRadius.sm
// @ts-expect-error unknown border width
tailwindTheme.borderWidth.xl
void [spacing, sizeText, leading, tracking, raw, radius, width]
export type { SpacingIsTyped, FontSizeIsTyped }
