import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './icon.shared'

const theme = store.getters['theme']

export const StIcon = styled('i', props)`
  display: inline-flex;
  width: ${({ size }) => theme.fontSize[size][0]};
  height: ${({ size }) => theme.fontSize[size][0]};
  font-size: ${({ size }) => theme.fontSize[size][0]};
  line-height: ${({ size }) => theme.fontSize[size][0]};
`
