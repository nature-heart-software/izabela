/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { props } from './divider.shared'
import { rem } from 'polished'

export const StDivider = styled('div', props)`
  ${({ direction }) => [
    direction === 'vertical' ? 'border-right' : 'border-top',
  ]}: ${() => rem(1)} solid ${({theme}) => theme.divider.borderColor};
  ${({ direction }) =>
    direction === 'vertical' &&
    `
    display: inline-flex;
  `}
`
