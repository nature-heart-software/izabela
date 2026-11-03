import { expect, it, vi } from 'vitest'
vi.mock('@/styles/tokens', () => import('../../design-tokens/src/main'))
import { tokens } from '../../design-tokens/src/main'
import {
  fontSizeStyle,
  borderRadiusStyleBySize,
  disabledItemBackgroundStyle,
} from '../src/utils/css-in-js'

it('uses source-owned typography metrics for scalar font-size tokens', () => {
  const style = fontSizeStyle(tokens.fontSize[2])
  expect(style.fontSize).toBe('0.875rem')
  expect(style.lineHeight).toBe(tokens.lineHeight.default)
  expect(style.letterSpacing).toBe(`${tokens.letterSpacing.default / 16}rem`)
})
it('maps large control geometry to the authored medium radius', () => {
  expect(borderRadiusStyleBySize('lg')).toEqual({
    borderRadius: `${tokens.radius.md / 16}rem`,
  })
})
it('uses the complete authored denied-backdrop color without old opacity roles', () => {
  expect(
    disabledItemBackgroundStyle({
      theme: {
        accessBlocker: { default: { denied: { background: '#abcdef80' } } },
      },
    }),
  ).toContain('#abcdef80')
})
