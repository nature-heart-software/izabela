/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props } from './divider.shared'
import { rem } from 'polished'

const { colors } = tokens

export const StDivider = styled('div', props)`
  ${({ direction }) => [direction === 'vertical' ? 'border-right' : 'border-top']}: ${() =>
    rem('1px')} solid ${() => colors.gray['20']};
  ${({ direction }) =>
    direction === 'vertical' &&
    `
    display: inline-flex;
  `}
`
