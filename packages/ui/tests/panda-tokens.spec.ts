import { describe, expect, it } from 'vitest'
import { token } from '../src/styled-system/tokens'

const value = token as (path: string) => string

describe('Panda design-token mapping', () => {
  it('preserves Izabela typography rather than interpreting numeric token names as CSS lengths', () => {
    expect(value('fontSizes.2')).toBe('0.875rem')
    expect(value('lineHeights.2')).toBe('1.4')
    expect(value('letterSpacings.2')).toBe('0.02rem')
    expect(value('fonts.sans')).toContain('Nunito')
  })
  it('uses the same Izabela geometry for spacing and control sizing', () => {
    expect(value('spacing.7')).toBe('2rem')
    expect(value('sizes.7')).toBe('2rem')
  })
})
