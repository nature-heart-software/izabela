/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import lightTheme from '@/tokens/light'
import { props } from './divider.shared'
import { rem } from 'polished'

export const StDivider = styled('div', props)`
  ${({ direction }) => [
    direction === 'vertical' ? 'border-right' : 'border-top',
  ]}: ${() => rem(1)} solid ${() => lightTheme.divider.color};
  ${({ direction }) =>
    direction === 'vertical' &&
    `
    display: inline-flex;
  `}
`
