/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { selectProps, SelectProps, Size } from './select.shared'
import { CSSObject } from '@/types/css-in-js'
import { rem } from 'polished'
import { defaultTextStyle } from '@/components/typography/Text/text.styled'
import 'element-plus/lib/components/option/style/css'
import {
  borderRadiusStyleBySize,
  fontSizeStyle,
  horizontalPaddingWithIconStyleBySize,
  iconStyleBySize,
} from '@/utils/css-in-js'

const { fontSize, spacing, borderWidth, colors, transition } = tokens
const iconStyle = ({ size }: SelectProps) => {
  const position = iconStyleBySize(size)
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
const inputStyleBySize = ({ size }: SelectProps) => {
  const styles: Record<Size, CSSObject> = {
    sm: {
      height: rem(spacing['5']),
    },
    md: {
      height: rem(spacing['6']),
    },
    lg: {
      height: rem(spacing['7']),
    },
  }
  return styles[size]
}
const styleBySize = ({ size }: SelectProps) => {
  const borderRadius = borderRadiusStyleBySize(size)
  const horizontalPadding = horizontalPaddingWithIconStyleBySize(size)
  const styles: Record<Size, CSSObject> = {
    sm: {
      ...borderRadius,
      ...horizontalPadding,
      ...fontSizeStyle(fontSize['1']),
      minHeight: rem(spacing['6']),
      paddingTop: rem(spacing['2']),
      paddingBottom: rem(spacing['2']),
    },
    md: {
      ...borderRadius,
      ...horizontalPadding,
      ...fontSizeStyle(fontSize['1']),
      minHeight: rem(spacing['7']),
      paddingTop: rem(spacing['2']),
      paddingBottom: rem(spacing['2']),
    },
    lg: {
      ...borderRadius,
      ...horizontalPadding,
      ...fontSizeStyle(fontSize['2']),
      minHeight: rem(spacing['8']),
      paddingTop: rem(spacing['2']),
      paddingBottom: rem(spacing['2']),
    },
  }
  return styles[size]
}

export const StSelect = styled('div', selectProps)`
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  border-width: ${() => rem(borderWidth.DEFAULT)};
  border-color: ${() => colors.gray['20']};
  transition: ${() => transition.DEFAULT};

  ${(props) => styleBySize(props)}
  &:hover {
    border-color: ${() => colors.gray['30']};
  }

  ${({ isFocused }) =>
    isFocused && {
      boxShadow: `0 0 0 ${rem(borderWidth.lg)} ${colors.gray['10']}`,
      borderColor: colors.gray['30'],
    }}
`

export const StSelectWrapper = styled('div', selectProps)`
  position: relative;
  margin-top: ${() => rem(-borderWidth.DEFAULT)};
  margin-bottom: ${() => rem(-borderWidth.DEFAULT)};
  display: flex;
  align-items: center;
  font-weight: 600;
  transition: ${() => transition.DEFAULT};
`
export const StSelectTagsWrapper = styled('div')`
  margin-left: ${() => rem(-spacing['4'])};
`
export const StSelectInput = styled('input', selectProps)`
  cursor: pointer;
  outline: none;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  width: 100%;
  ${inputStyleBySize};

  &::placeholder {
    color: ${() => colors.gray['40']};
    font-weight: 300;
    font-size: inherit;
    letter-spacing: inherit;
  }
`

export const StSelectIcon = styled('div', selectProps)`
  display: inline-flex;
  pointer-events: none;
  position: absolute;
  ${(props) => iconStyle(props)}
`
export const StSelectOption = styled('div', {
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
})`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: ${() => rem(spacing['7'])} !important;
  padding: 0 ${() => rem(spacing['5'])} !important;
  ${defaultTextStyle};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  & .option__content {
    position: relative;
    z-index: 0;
    max-width: 100%;
    ${({ readonly }) =>
      readonly &&
      `
    &::before {
        content: '';
        z-index: -1;
        position: absolute;
        display: inline-flex;
        inset: ${rem(-spacing['2'])};
        background-color: ${colors.white};
    }
    `}
  }
  & .option__after {
    flex-shrink: 0;
  }
  ${({ disabled, selected, active, readonly }) =>
    readonly
      ? ` 
          cursor: auto;
            color: ${colors.gray['40']} !important;
            position: relative;
            z-index: 0;
            &::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                transform: translateY(-50%);
                background-color: ${colors.gray['20']};
                height: ${rem(1)};
                width: 100%;
                z-index: -1;
            }
          `
      : disabled
        ? `
          user-select: none;
          pointer-events: none;
          color: ${colors.gray['40']} !important;
      `
        : `
        &:hover {
            background-color: ${colors.gray['10']} !important;
        }
        ${
          selected
            ? `
            font-weight: 700;
            background-color: ${colors.gray['10']} !important;
          `
            : ''
        }
        ${
          active
            ? `
            background-color: ${colors.gray['20']} !important;
          `
            : ''
        }
      `}
`
