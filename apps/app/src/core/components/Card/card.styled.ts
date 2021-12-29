import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './card.shared'

const theme = store.getters['theme']

export const StCard = styled('div', props)`
  background-color: ${theme.colors.white};
  padding: ${theme.space['4']};
  border-radius: ${theme.borderRadius.DEFAULT}
  box-shadow: ${theme.boxShadow.DEFAULT}
`
