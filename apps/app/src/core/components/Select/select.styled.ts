/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './select.shared'
import { Props, Size } from './select.shared'
import { CSSObject } from '@/types/css-in-js'
import { math, rem, remToPx } from 'polished'
import { defaultTextStyle } from '../Text/text.styled'
import { ElOption } from 'element-plus'
import 'element-plus/lib/components/option/style/css'

const { fontSize, spacing, boxShadow, borderRadius, borderWidth, colors, transition } =
  store.getters.theme
const getIconStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    sm: {
      right: `${rem(math(`${remToPx(spacing['3'])} + 1px`))}`,
    },
    md: {
      right: `${rem(math(`${remToPx(spacing['5'])} + 1px`))}`,
    },
    lg: {
      right: `${rem(math(`${remToPx(spacing['5'])} + 1px`))}`,
    },
  }
  return styles[size]
}

const getStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    sm: {
      padding: `0 ${spacing['3']}`,
      paddingRight: rem(math(`${remToPx(spacing['6'])} + ${remToPx(spacing['3'])}`)),
      borderRadius: borderRadius.sm,
      height: spacing['6'],
    },
    md: {
      padding: `0 ${spacing['5']}`,
      paddingRight: rem(math(`${remToPx(spacing['7'])} + ${remToPx(spacing['5'])}`)),
      height: spacing['7'],
    },
    lg: {
      padding: `0 ${spacing['5']}`,
      paddingRight: rem(math(`${remToPx(spacing['8'])} + ${remToPx(spacing['5'])}`)),
      height: spacing['8'],
      fontSize: fontSize['2'][0],
      ...fontSize['2'][1],
    },
  }
  return styles[size]
}

const getPopperStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    sm: {
      // top: rem(math(`${ remToPx(spacing['6']) } + ${ remToPx(spacing['3']) }`))+' !important',
      borderRadius: borderRadius.sm,
    },
    md: {
      // top: rem(math(`${ remToPx(spacing['7']) } + ${ remToPx(spacing['3']) }`))+' !important',
      borderRadius: borderRadius.DEFAULT,
    },
    lg: {
      // top: rem(math(`${ remToPx(spacing['8']) } + ${ remToPx(spacing['3']) }`))+' !important',
      borderRadius: borderRadius.DEFAULT,
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
        box-shadow: 0 0 0 ${borderWidth.lg} ${colors.gray['10']};
        border-color: ${colors.gray['30']} !important;
      }
    }

    .el-input__inner {
      align-items: center;
      font-size: ${fontSize['1'][0]};
      ${fontSize['1'][1]}
      font-weight: 600;
      border-width: ${borderWidth.DEFAULT};
      outline: 0;
      border-color: ${colors.gray['20']};
      transition: ${transition.DEFAULT};

      ${getPopperStyleFromSize}
      &:hover {
        border-color: ${colors.gray['30']};
      }

      &:focus {
        box-shadow: 0 0 0 ${borderWidth.lg} ${colors.gray['10']};
        border-color: ${colors.gray['30']};
      }

      &::placeholder {
        color: ${colors.gray['40']};
        font-weight: 300;
      }

      ${getStyleFromSize}
    }

    .el-input__suffix {
      display: none;
    }
  }

  .el-popper {
    box-shadow: ${boxShadow.lg} !important;
    border-color: ${colors.gray['20']} !important;

    ${getPopperStyleFromSize}
    .el-popper__arrow {
      display: none;
    }
  }

  .el-select {
    width: 100%;

    .el-select__input {
      margin-top: ${spacing['2']};
      height: ${spacing['6']};
    }

    .el-select__tags {
      top: 0;
      transform: none;

      .el-tag {
        margin: ${spacing['2']} 0 0 ${spacing['2']};

        &--info {
          background-color: ${colors.gray['10']};
        }

        .el-tag__close {
          &:hover {
            color: inherit !important;
            background-color: ${colors.gray['20']};
          }

          &:active {
            background-color: ${colors.gray['30']};
          }
        }
      }
    }

    .el-select-dropdown__list {
      padding: 0;
    }

    .el-select-dropdown__empty {
      padding: ${spacing['3']};
      ${() => defaultTextStyle}
    }

    .el-select-dropdown__item {
      ${() => defaultTextStyle}
    }

    &:hover {
      .el-input__inner {
        border-color: ${ colors.gray['30'] };
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
      ${getIconStyleFromSize}
    }
  }
`

export const StOption = styled(ElOption)`
  display: inline-flex;
  align-items: center;
  width: 100%;
  height: ${spacing['7']} !important;
  padding: 0 ${spacing['5']} !important;

  &:hover:not(.is-disabled),
  &.hover:not(.is-disabled) {
    background-color: ${colors.gray['10']} !important;
  }

  //
  // &:active:not(.is-disabled) {
  //   background-color: ${colors.gray['30']} !important;
  // }
  //
  // &:focus:not(.is-disabled) {
  //   box-shadow: 0 0 0 ${borderWidth.lg} ${colors.gray['10']};
  // }

  &.selected:not(.is-disabled) {
    color: inherit !important;
    font-weight: 600;
    background-color: ${colors.gray['10']} !important;
  }

  &.is-disabled {
    color: ${colors.gray['40']} !important;
  }
`
