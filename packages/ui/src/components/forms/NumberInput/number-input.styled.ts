/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import lightTheme from '@/tokens/light'
import { props, Props, Size } from './number-input.shared'
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
export const StNumberInput = styled('div', props)`
  display: inline-flex;
  width: min-content;

  & > * {
    width: 100%;
  }

  .el-input {
    line-height: 1;

    .el-input__inner {
      align-items: center;
      font-weight: 600;
      border-width: ${() => rem(borderWidth.DEFAULT)};
      outline: 0;
      border-color: ${() => lightTheme.numberInput.borderColor};
      transition: ${() => transition.DEFAULT};
      min-width: ${() => rem(80)};
      width: 100%;

      &:hover {
        border-color: ${() => lightTheme.numberInput.hover.borderColor};
      }

      &:focus {
        box-shadow: 0 0 0 ${() => rem(borderWidth.lg)}
          ${() => lightTheme.numberInput.focus.boxShadow};
        border-color: ${() => lightTheme.numberInput.focus.borderColor};
      }

      &::placeholder {
        color: ${() => lightTheme.numberInput.placeholder.color};
        font-weight: 300;
      }

      ${styleBySize}
    }
  }
`
