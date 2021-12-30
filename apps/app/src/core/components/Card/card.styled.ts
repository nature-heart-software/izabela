/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './card.shared'
import { Props, Size } from './card.shared'
import { CSSObject } from '@/types/css-in-js'

const { colors, space, borderRadius, boxShadow } = store.getters.theme
const getStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    xs: {
      padding: `${space['2']}`,
    },
    sm: {
      padding: `${space['3']}`,
    },
    md: {
      padding: `${space['5']}`,
    },
  }
  return styles[size]
}
export const StCard = styled('div', props)`
  background-color: ${colors.white};
  padding: ${space['3']};
  border-radius: ${borderRadius.DEFAULT};
  box-shadow: ${boxShadow.DEFAULT};
  font-size: 0;
  ${getStyleFromSize}
`
