/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props } from './icon.shared'

const { fontSize } = tokens

export const StIcon = styled('i', props)`
  display: inline-flex;
  width: ${({ size }) => fontSize[size][0]};
  height: ${({ size }) => fontSize[size][0]};
  font-size: ${({ size }) => fontSize[size][0]};
  line-height: ${({ size }) => fontSize[size][0]};
`
