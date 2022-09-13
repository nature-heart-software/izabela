/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props } from './icon.shared'
import { rem } from 'polished'

const { fontSize } = tokens

export const StIcon = styled('i', props)`
  display: inline-flex;
  width: ${ ({ size }) => rem(fontSize[size][0]) };
  height: ${ ({ size }) => rem(fontSize[size][0]) };
  font-size: ${ ({ size }) => rem(fontSize[size][0]) };
  line-height: ${ ({ size }) => rem(fontSize[size][0]) };
`
