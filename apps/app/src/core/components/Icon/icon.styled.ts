/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './icon.shared'

const {
  fontSize,
} = store.getters.theme

export const StIcon = styled('i', props)`
  display: inline-flex;
  width: ${({ size }) => fontSize[size][0]};
  height: ${({ size }) => fontSize[size][0]};
  font-size: ${({ size }) => fontSize[size][0]};
  line-height: ${({ size }) => fontSize[size][0]};
`
