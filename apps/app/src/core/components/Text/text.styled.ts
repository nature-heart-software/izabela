/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './text.shared'

const {
  fontFamily,
  fontSize,
} = store.getters.theme

export const StText = styled('div', props)`
  color: inherit;
  font-family: ${fontFamily.sans.join(', ')};
  font-size: ${({ size }) => fontSize[size][0]};
  line-height: ${({ size }) => fontSize[size][1].lineHeight};
  letter-spacing: ${({ size }) => fontSize[size][1].letterSpacing};
  ${({ as }) => as === 'span' && `
    display: inline-flex;
  `}
`
