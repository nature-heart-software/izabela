import { describe, expect, it } from 'vitest'
import { token } from '../src/styled-system/tokens'

const value = token as (path: string) => string

describe('Panda design-token mapping', () => {
  it('preserves Izabela typography rather than interpreting numeric token names as CSS lengths', () => {
    expect(value('fontSizes.2')).toBe('0.875rem')
    expect(Number(value('lineHeights.default'))).toBeCloseTo(1.4)
    expect(parseFloat(value('letterSpacings.default'))).toBeCloseTo(0.02)
    expect(value('lineHeights.2')).toBeUndefined()
    expect(value('letterSpacings.2')).toBeUndefined()
    expect(value('fonts.sans')).toContain('Nunito')
  })
  it('uses the same Izabela geometry for spacing and control sizing', () => {
    expect(value('spacing.7')).toBe('2rem')
    expect(value('sizes.7')).toBe('2rem')
  })
})
