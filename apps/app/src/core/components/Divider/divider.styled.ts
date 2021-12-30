/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './divider.shared'
import { rem } from 'polished'

const { colors } = store.getters.theme

export const StDivider = styled('div', props)`
  ${({ direction }) => [direction === 'vertical' ? 'border-right' : 'border-top']}: ${() =>
    rem('1px')} solid ${colors.gray['10']};
  ${({ direction }) =>
    direction === 'vertical' &&
    `
    display: inline-flex;
  `}
`
