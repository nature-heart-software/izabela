/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './card.shared'

const {
  colors,
  space,
  borderRadius,
  boxShadow,
} = store.getters.theme

export const StCard = styled('div', props)`
  background-color: ${colors.white};
  padding: ${space['3']};
  border-radius: ${borderRadius.DEFAULT};
  box-shadow: ${boxShadow.DEFAULT};
  font-size: 0;
`
