/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { props, Props, Size } from './input.shared'
import { CSSObject } from '@/types/css-in-js'
import {
    borderRadiusStyleBySize,
    fontSizeStyle,
    horizontalPaddingStyleBySize,
} from '@/utils/css-in-js'
import { rem } from 'polished'

const { fontSize, spacing, borderRadius, borderWidth, colors, transition } =
    tokens
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
      border-width: ${ () => rem(borderWidth.DEFAULT) };
      outline: 0;
      border-color: ${ () => colors.gray['20'] };
      transition: ${ () => transition.DEFAULT };
      color: ${ () => colors.gray['90'] };

      &:hover {
        border-color: ${ () => colors.gray['30'] };
      }

      &:focus {
        box-shadow: 0 0 0 ${ () => rem(borderWidth.lg) }
          ${ () => colors.gray['10'] };
        border-color: ${ () => colors.gray['30'] };
      }

      &::placeholder {
        color: ${ () => colors.gray['40'] };
        font-weight: 300;
      }

      ${ styleBySize }
    }
  }
`
