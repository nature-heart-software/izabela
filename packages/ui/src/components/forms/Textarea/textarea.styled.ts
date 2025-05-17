/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { props, Props, Size } from './textarea.shared'
import { CSSObject } from '@/types/css-in-js'
import {
  borderRadiusStyleBySize,
  fontSizeStyle,
  horizontalPaddingStyleBySize,
} from '@/utils/css-in-js'
import { rem } from 'polished'

const { fontSize, spacing, borderRadius, borderWidth, transition } = tokens
const styleBySize = ({ size }: Props) => {
  const borderRadius = borderRadiusStyleBySize(size)
  const horizontalPadding = horizontalPaddingStyleBySize(size)
  const styles: Record<Size, CSSObject> = {
    sm: {
      ...fontSizeStyle(fontSize['1']),
      ...borderRadius,
      ...horizontalPadding,
      height: rem(spacing['6']),
    },
    md: {
      ...fontSizeStyle(fontSize['1']),
      ...borderRadius,
      ...horizontalPadding,
      height: rem(spacing['7']),
    },
    lg: {
      ...fontSizeStyle(fontSize['2']),
      ...borderRadius,
      ...horizontalPadding,
      height: rem(spacing['8']),
    },
  }
  return styles[size]
}
export const StTextarea = styled('textarea', props)`
      align-items: center;
      font-weight: 600;
      border-width: ${() => rem(borderWidth.DEFAULT)};
      outline: 0;
      border-color: ${({ theme }) => theme.input.borderColor};
      transition: ${() => transition.DEFAULT};
      color: ${({ theme }) => theme.input.color};
      background: ${({ theme }) => theme.input.backgroundColor};
      &:hover {
        border-color: ${({ theme }) => theme.input.hover.borderColor};
      }

      &:focus {
        box-shadow: 0 0 0 ${() => rem(borderWidth.lg)}
          ${({ theme }) => theme.input.focus.boxShadow};
        border-color: ${({ theme }) => theme.input.focus.borderColor};
      }

      &::placeholder {
        color: ${({ theme }) => theme.input.placeholder.color};
        font-weight: 300;
      }

      ${styleBySize}

      height: ${() => rem(spacing['10'])};
      padding-top: ${() => rem(spacing['3'] - 1)};
      padding-bottom: ${() => rem(spacing['3'] - 1)};
      border-bottom-right-radius: 0;
`
