/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props, Props, Size } from './select.shared'
import { CSSObject } from '@/types/css-in-js'
import { math, rem } from 'polished'
import { defaultTextStyle } from '@/components/typography/Text/text.styled'
import { ElOption } from 'element-plus'
import 'element-plus/lib/components/option/style/css'
import {
  borderRadiusStyleBySize,
  fontSizeStyle,
  horizontalPaddingWithIconStyleBySize,
  iconStyleBySize,
} from '@/utils/css-in-js'

const { fontSize, spacing, boxShadow, borderWidth, colors, transition } = tokens
const iconStyle = ({ size }: Props) => {
  const position = Object.fromEntries(
    Object.entries(iconStyleBySize(size)).map(([key, value]) =>
      key === 'right' ? [key, math(`${value} + ${rem(1)}`)] : [key, value],
    ),
  )
  const styles: Record<Size, CSSObject> = {
    sm: {
      ...position,
    },
    md: {
      ...position,
    },
    lg: {
      ...position,
    },
  }
  return styles[size]
}

const styleBySize = ({ size }: Props) => {
  const borderRadius = borderRadiusStyleBySize(size)
  const horizontalPadding = horizontalPaddingWithIconStyleBySize(size)
  const styles: Record<Size, CSSObject> = {
    sm: {
      ...borderRadius,
      ...horizontalPadding,
      height: rem(spacing['6']),
    },
    md: {
      ...borderRadius,
      ...horizontalPadding,
      height: rem(spacing['7']),
    },
    lg: {
      ...borderRadius,
      ...horizontalPadding,
      height: rem(spacing['8']),
      ...fontSizeStyle(fontSize['2']),
    },
  }
  return styles[size]
}

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

export const StSelect = styled('div', props)`
  display: inline-flex;

  & > * {
    width: 100%;
  }

  .el-input {
    line-height: 1;

    &.is-focus {
      .el-input__inner {
        box-shadow: 0 0 0 ${() => rem(borderWidth.lg)}
          ${() => colors.gray['10']};
        border-color: ${() => colors.gray['30']} !important;
      }
    }

    .el-input__inner {
      align-items: center;
      ${() => fontSizeStyle(fontSize['1'])}
      font-weight: 600;
      border-width: ${() => rem(borderWidth.DEFAULT)};
      outline: 0;
      border-color: ${() => colors.gray['20']};
      transition: ${() => transition.DEFAULT};

      ${popperStyleBySize}
      &:hover {
        border-color: ${() => colors.gray['30']};
      }

      &:placeholder-shown {
        height: ${(props) => styleBySize(props).height || ''} !important;
      }

      &:focus {
        box-shadow: 0 0 0 ${() => rem(borderWidth.lg)}
          ${() => colors.gray['10']};
        border-color: ${() => colors.gray['30']};
      }

      &::placeholder {
        color: ${() => colors.gray['40']};
        font-weight: 300;
      }

      ${styleBySize}
    }

    .el-input__suffix {
      display: none;
    }
  }

  .el-popper {
    box-shadow: ${() => boxShadow.lg} !important;
    border-color: ${() => colors.gray['20']} !important;
    overflow: hidden;

    ${popperStyleBySize}
    .el-popper__arrow {
      display: none;
    }
  }

  .el-select {
    width: 100%;

    .el-select__input {
      margin-top: ${() => rem(spacing['2'])};
      height: ${() => rem(spacing['6'])};
      width: 100% !important;
    }

    .el-select__tags {
      top: 0;
      transform: none;

      .el-tag {
        margin: ${() => rem(spacing['2'])} 0 0 ${() => rem(spacing['2'])};

        &--info {
          background-color: ${() => colors.gray['10']};
        }

        .el-tag__close {
          &:hover {
            color: inherit !important;
            background-color: ${() => colors.gray['20']};
          }

          &:active {
            background-color: ${() => colors.gray['30']};
          }
        }
      }
    }

    .el-select-dropdown__list {
      padding: 0;
    }

    .el-select-dropdown__empty {
      padding: ${() => rem(spacing['3'])};
      ${() => defaultTextStyle()}
    }

    .el-select-dropdown__item {
      ${() => defaultTextStyle()}
    }

    &:hover {
      .el-input__inner {
        border-color: ${() => colors.gray['30']};
      }
    }
  }

  .nv-selectWrapper {
    display: flex;
    align-items: center;
    position: relative;

    .nv-select__icon {
      pointer-events: none;
      position: absolute;
      ${iconStyle}
    }
  }
`

export const StOption = styled(ElOption)`
  display: inline-flex;
  align-items: center;
  width: 100%;
  height: ${() => rem(spacing['7'])} !important;
  padding: 0 ${() => rem(spacing['5'])} !important;

  &:hover:not(.is-disabled),
  &.hover:not(.is-disabled) {
    background-color: ${() => colors.gray['10']} !important;
  }

  //
  // &:active:not(.is-disabled) {
  //   background-color: ${() => colors.gray['30']} !important;
  // }
  //
  // &:focus:not(.is-disabled) {
  //   box-shadow: 0 0 0 ${() => rem(borderWidth.lg)} ${() =>
    colors.gray['10']};
  // }

  &.selected:not(.is-disabled) {
    color: inherit !important;
    font-weight: 600;
    background-color: ${() => colors.gray['10']} !important;
  }

  &.is-disabled {
    color: ${() => colors.gray['40']} !important;
  }
`
