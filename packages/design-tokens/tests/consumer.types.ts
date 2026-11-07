import { tokens } from '..'

type IsAny<T> = 0 extends 1 & T ? true : false
type Assert<T extends true> = T
type NotAny<T> = IsAny<T> extends true ? false : true
type SpacingIsTyped = Assert<NotAny<(typeof tokens.spacing)[1]>>
type FontSizeIsTyped = Assert<NotAny<(typeof tokens.fontSize)[3]>>
const spacing: 2 = tokens.spacing[1]
const [size, options] = tokens.fontSize[3]
const sizeValue: 16 = size
const leading: 1.4 = options.lineHeight
const tracking: 0.32 = options.letterSpacing
const radius: 8 = tokens.borderRadius.DEFAULT
const width: 4 = tokens.borderWidth.lg
// @ts-expect-error tokens are readonly
tokens.spacing[1] = 3
// @ts-expect-error only declared spacing keys are available
tokens.spacing[99]
// @ts-expect-error font options are not strings
const invalidOptions: string = options
// @ts-expect-error raw dimensions are numbers
const invalidRadius: string = tokens.borderRadius.sm
// @ts-expect-error unknown border width
tokens.borderWidth.xl
void [spacing, sizeValue, leading, tracking, radius, width]
export type { SpacingIsTyped, FontSizeIsTyped }
