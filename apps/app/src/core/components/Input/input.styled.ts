/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props } from './input.shared'
import { Props, Size } from './input.shared'
import { CSSObject } from '@/types/css-in-js'
import { fontSizeStyle } from '@/utils/css-in-js'

const { fontSize, spacing, borderRadius, borderWidth, colors, transition } = tokens
const getStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    sm: {
      ...fontSizeStyle(fontSize['1']),
      padding: `0 ${spacing['3']}`,
      height: spacing['6'],
    },
    md: {
      ...fontSizeStyle(fontSize['1']),
      padding: `0 ${spacing['5']}`,
      height: spacing['7'],
    },
    lg: {
      ...fontSizeStyle(fontSize['2']),
      padding: `0 ${spacing['5']}`,
      height: spacing['8'],
    },
  }
  return styles[size]
}
export const StInput = styled('div', props)`
  display: inline-flex;

  & > * {
    width: 100%;
  }

  .el-input {
    line-height: 1;

    .el-input__inner {
      align-items: center;
      font-weight: 600;
      border-radius: ${() => borderRadius.DEFAULT};
      border-width: ${() => borderWidth.DEFAULT};
      outline: 0;
      border-color: ${() => colors.gray['20']};
      transition: ${() => transition.DEFAULT};

      &:hover {
        border-color: ${() => colors.gray['30']};
      }

      &:focus {
        box-shadow: 0 0 0 ${() => borderWidth.lg} ${() => colors.gray['10']};
        border-color: ${() => colors.gray['30']};
      }

      &::placeholder {
        color: ${() => colors.gray['40']};
        font-weight: 300;
      }

      ${getStyleFromSize}
    }
  }
`
