/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './stack.shared'

const { spacing } = store.getters.theme
const POSITIONS = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  stretch: 'stretch',
}

export const StStack = styled('div', props)`
  display: flex;
  flex-direction: column;
  justify-content: ${({ justify }) => POSITIONS[justify]};
  align-items: ${({ align }) => POSITIONS[align]};
  gap: ${({ spacing: spacingKey }) => spacing[spacingKey]};
`
