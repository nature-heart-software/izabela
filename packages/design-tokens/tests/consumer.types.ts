import { tokens } from '..'

type IsAny<T> = 0 extends 1 & T ? true : false
type Assert<T extends true> = T
type NotAny<T> = IsAny<T> extends true ? false : true
type SpacingIsTyped = Assert<NotAny<typeof tokens.spacing[1]>>
type FontSizeIsTyped = Assert<NotAny<typeof tokens.fontSize[3]>>
const spacing: number = tokens.spacing[1]
const sizeValue: number = tokens.fontSize[3]
const leading: number = tokens.lineHeight.default
const tracking: number = tokens.letterSpacing.default
const radius: number = tokens.radius.md
const width: number = tokens.border.lg
// @ts-expect-error tokens are readonly
tokens.spacing[1] = 3
// @ts-expect-error only declared spacing keys are available
tokens.spacing[99]
// @ts-expect-error font sizes are scalar numbers
const invalidSize: string = tokens.fontSize[3]
// @ts-expect-error raw dimensions are numbers
const invalidRadius: string = tokens.radius.sm
// @ts-expect-error unknown border width
tokens.border.xl
// @ts-expect-error token namespaces follow the source collection
tokens.borderRadius
void [spacing, sizeValue, leading, tracking, radius, width]
export type { SpacingIsTyped, FontSizeIsTyped }
