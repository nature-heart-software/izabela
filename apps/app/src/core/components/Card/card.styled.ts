/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props } from './card.shared'
import { Props, Size } from './card.shared'
import { CSSObject } from '@/types/css-in-js'

const { colors, spacing, borderRadius, boxShadow } = tokens
const getStyleFromSize = ({ size }: Props) => {
  const styles: Record<Size, CSSObject> = {
    xs: {
      padding: `${spacing['2']}`,
    },
    sm: {
      padding: `${spacing['3']}`,
    },
    md: {
      padding: `${spacing['5']}`,
    },
  }
  return styles[size]
}
export const StCard = styled('div', props)`
  background-color: ${() => colors.white};
  padding: ${() => spacing['3']};
  border-radius: ${() => borderRadius.DEFAULT};
  box-shadow: ${() => boxShadow.DEFAULT};
  font-size: 0;
  ${getStyleFromSize}
`
