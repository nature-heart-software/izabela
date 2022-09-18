/* eslint-disable */
import styled from 'vue3-styled-components'
import { props, Props, Size } from './autocomplete.shared'
import { rem } from 'polished'
import tokens from '@/styles/tokens'
import { borderRadiusStyleBySize } from '@/utils/css-in-js'
import { CSSObject } from '@/types/css-in-js'

const { boxShadow, colors } = tokens

const popperStyleBySize = ({ size }: Props) => {
  const borderRadius = borderRadiusStyleBySize(size)
  const styles: Record<Size, CSSObject> = {
    sm: {
      ...borderRadius,
    },
    md: {
      ...borderRadius,
    },
    lg: {
      ...borderRadius,
    },
  }
  return styles[size]
}

export const StAutocomplete = styled('div', props)`
  position: absolute;
  width: ${({ width }) => rem(width || 300)};
  border-width: ${() => rem(tokens.borderWidth.DEFAULT)};
  border-style: solid;
  box-shadow: ${() => boxShadow.lg} !important;
  border-color: ${() => colors.gray['20']} !important;
  overflow: hidden;

  ${popperStyleBySize}
  .autocomplete__scroller {
    height: ${() => rem(250)};
    overflow-y: auto;
  }
`
