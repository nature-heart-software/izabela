/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props } from './stack.shared'

const { spacing } = tokens
const POSITIONS = {
  start: 'flex-start',
  left: 'flex-start',
  center: 'center',
  end: 'flex-end',
  right: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  stretch: 'stretch',
  apart: 'space-between',
}

export const StStack = styled('div', props)`
  display: flex;
  flex-direction: column;
  justify-content: ${({ justify }) => POSITIONS[justify]};
  align-items: ${({ align }) => POSITIONS[align]};
  gap: ${({ spacing: spacingKey }) => spacing[spacingKey]};
`
