/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
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

const { fontSize, spacing, borderWidth, transition } = tokens
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
  border-color: ${({theme}) => theme.select.borderColor};
  transition: ${() => transition.DEFAULT};
  color: ${({theme}) => theme.select.color};
  background: ${({theme}) => theme.select.backgroundColor};

  ${(props) => styleBySize(props)}
  &:hover {
    border-color: ${({theme}) => theme.select.hover.borderColor};
  }

  ${({ theme, isFocused }) =>
    isFocused && {
      boxShadow: `0 0 0 ${rem(borderWidth.lg)} ${theme.select.focus.boxShadow}`,
      borderColor: theme.select.focus.borderColor,
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

  color: ${({theme}) => theme.select.color};
  background: ${({theme}) => theme.select.backgroundColor};
  
  &::placeholder {
    color: ${({theme}) => theme.select.placeholder.color};
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
    min-width: 0;
    ${({ theme, readonly }) =>
      readonly &&
      `
    &::before {
        content: '';
        z-index: -1;
        position: absolute;
        display: inline-flex;
        inset: ${rem(-spacing['2'])};
        background-color: ${theme.select.option.backgroundColor};
    }
    `}
  }

  & .option__after {
    flex-shrink: 0;

    & > * {
      margin-left: ${() => rem(spacing['3'])};
    }
  }

  ${({ theme, disabled, selected, active, readonly }) =>
    readonly
      ? ` 
          cursor: auto;
            color: ${theme.select.option.readonly.color} !important;
            position: relative;
            z-index: 0;
            &::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                transform: translateY(-50%);
                background-color: ${theme.select.option.readonly.borderColor};
                height: ${rem(1)};
                width: 100%;
                z-index: -1;
            }
          `
      : disabled
        ? `
          user-select: none;
          pointer-events: none;
          color: ${theme.select.option.disabled.backgroundColor} !important;
      `
        : `
        &:hover {
            background-color: ${theme.select.option.hover.backgroundColor} !important;
        }
        ${
          selected
            ? `
            font-weight: 700;
            background-color: ${theme.select.option.selected.backgroundColor} !important;
          `
            : ''
        }
        ${
          active
            ? `
            background-color: ${theme.select.option.active.backgroundColor} !important;
          `
            : ''
        }
      `}
`
