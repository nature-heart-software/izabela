/* eslint-disable */
import styled from 'vue3-styled-components'
import { defaultWidth, props, Props, Size } from './autocomplete.shared'
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

export const StAutocompleteReferenceWrapper = styled('div', props)`
  display: inline-flex;
  width: 100%;

  & > * {
    min-width: 0;
    flex: 1;
  }
`

export const StAutocomplete = styled('div', props)`
  width: ${({ width = defaultWidth }) => rem(width)};
  border-width: ${() => rem(tokens.borderWidth.DEFAULT)};
  border-style: solid;
  box-shadow: ${() => boxShadow.lg} !important;
  border-color: ${() => colors.gray['20']} !important;
  overflow: hidden;
  background-color: ${() => colors.white};

  ${popperStyleBySize}
  .autocomplete__list {
    max-height: ${() => rem(200)};
    overflow-y: auto;
  }
`
