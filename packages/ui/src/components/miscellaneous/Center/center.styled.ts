/* eslint-disable */
import styled from 'vue3-styled-components'
import { props } from './center.shared'
import lightTheme from '@/tokens/light'

export const StCenter = styled('div', props)`
  display: ${({ inline }) => (inline ? 'inline-flex' : 'flex')};
  align-items: center;
  justify-content: center;
`
