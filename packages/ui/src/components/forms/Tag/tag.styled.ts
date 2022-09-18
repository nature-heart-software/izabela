/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props } from './tag.shared'
import { rem } from 'polished'
import {
    borderRadiusStyleBySize,
    fontSizeStyle,
    horizontalPaddingStyleBySize,
    horizontalPaddingWithIconStyleBySize,
    iconStyleBySize,
} from '@/utils/css-in-js'

const { borderWidth, transition, colors, fontSize, spacing } = tokens

export const StTagContentWrapper = styled('span', props)`
  position: relative;
  margin: ${() => rem(-borderWidth.DEFAULT)};
  ${({ closable }) =>
    (closable
      ? horizontalPaddingWithIconStyleBySize
      : horizontalPaddingStyleBySize)('sm')};
`

export const StTagIcon = styled('span', props)`
  display: inline-flex;
  position: absolute;
  ${() => iconStyleBySize('sm')}
`

export const StTag = styled('span', props)`
  position: relative;
  display: inline-flex;
  height: ${() => rem(spacing['6'])};
  align-items: center;
  font-weight: 600;
  border-width: ${() => rem(borderWidth.DEFAULT)};
  outline: 0;
  transition: ${() => transition.DEFAULT};
  background-color: ${() => colors.white};
  border-color: ${() => colors.gray['20']};
  white-space: nowrap;

  ${() => fontSizeStyle(fontSize['1'])}
  ${() => borderRadiusStyleBySize('sm')}
`
