/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { props, Props, Size } from './button.shared'
import { CSSObject } from '@/types/css-in-js'
import {
  borderRadiusStyleBySize,
  fontSizeStyle,
  horizontalPaddingStyleBySize,
  horizontalPaddingWithIconStyleBySize,
  iconStyleBySize,
} from '@/utils/css-in-js'
import { rem } from 'polished'

const { spacing, borderWidth, fontSize, transition, boxShadow } = tokens

const styleBySize = ({ size, iconName }: Props) => {
  const horizontalPadding = (
    iconName
      ? horizontalPaddingWithIconStyleBySize
      : horizontalPaddingStyleBySize
  )(size)
  const borderRadius = borderRadiusStyleBySize(size)
  const styles: Record<Size, CSSObject> = {
    xs: {
      ...fontSizeStyle(fontSize['1']),
      ...borderRadius,
      ...horizontalPadding,
      height: rem(spacing['5']),
    },
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

const styleBySquared = ({ squared, size }: Props) => {
  const styles: Record<Size, CSSObject> = {
    xs: {
      width: (squared && rem(spacing['5'])) || '',
    },
    sm: {
      width: (squared && rem(spacing['6'])) || '',
    },
    md: {
      width: (squared && rem(spacing['7'])) || '',
    },
    lg: {
      width: (squared && rem(spacing['8'])) || '',
    },
  }

  return styles[size]
}

export const StButton = styled('button', props)`
  flex-shrink: 0;
  position: relative;
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  border-width: ${() => rem(borderWidth.DEFAULT)};
  outline: 0;
  transition: ${() => transition.DEFAULT};
  overflow: hidden;

  ${({ align = '' }) => align && `justify-content: ${align};`}
  ${(props) => styleBySize(props)}
    ${({ squared }) =>
    squared &&
    `
        padding: 0;
        justify-content: center;
    `}
    ${(props) => styleBySquared(props)}
    ${({ theme, type, selected }) =>
    [
      type === 'default' &&
        `
            color: ${theme.button.default.color};
            background-color: ${theme.button.default.backgroundColor};
            border-color: ${theme.button.default.borderColor};
            &:hover {
                background-color: ${theme.button.default.hover.backgroundColor};
            }

            &:active {
                background-color: ${theme.button.default.active.backgroundColor};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${theme.button.default.focus.boxShadow};
            }

            ${[
              selected &&
                `
                    background-color: ${theme.button.default.selected.backgroundColor};
                `,
            ].filter(Boolean)}
        `,
      type === 'active' &&
        `
            color: ${theme.button.active.color};
            background-color: ${theme.button.active.backgroundColor};
            border-color: ${theme.button.active.borderColor};
            border-width: ${rem(2)};
            &:hover {
                background-color: ${theme.button.active.hover.backgroundColor};
            }

            &:active {
                background-color: ${theme.button.active.active.backgroundColor};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${theme.button.active.focus.boxShadow};
            }

            ${[
              selected &&
                `
                    background-color: ${theme.button.active.selected.backgroundColor};
                `,
            ].filter(Boolean)}
        `,
      type === 'plain' &&
        `
            color: ${theme.button.plain.color};
            background-color: ${theme.button.plain.backgroundColor};
            border-color: ${theme.button.plain.borderColor};
            &:hover {
                border-color: ${theme.button.plain.hover.borderColor};
                background-color: ${theme.button.plain.hover.backgroundColor};
            }

            &:active {
                border-color: ${theme.button.plain.active.borderColor};
                background-color: ${theme.button.plain.active.backgroundColor};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${theme.button.plain.focus.boxShadow};
            }

            ${[
              selected &&
                `
                    border-color: ${theme.button.plain.selected.borderColor};
                    background-color: ${theme.button.plain.selected.backgroundColor};
                `,
            ].filter(Boolean)}
        `,
      type === 'ghost' &&
        `
            color: ${theme.button.ghost.color};
            background-color: ${theme.button.ghost.backgroundColor};
            border-color: ${theme.button.ghost.borderColor};
            &:hover {
                background-color: ${theme.button.ghost.hover.backgroundColor};
            }

            &:active {
                background-color: ${theme.button.ghost.active.backgroundColor};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${theme.button.ghost.focus.boxShadow};
            }

            ${[
              selected &&
                `
                    background-color: ${theme.button.ghost.selected.backgroundColor};
                `,
            ].filter(Boolean)}
        `,
      type === 'ghost-alt' &&
        `
            color: ${theme.button['ghost-alt'].color};
            background-color: ${theme.button['ghost-alt'].backgroundColor};
            border-color: ${theme.button['ghost-alt'].borderColor};
            &:hover {
                background-color: ${theme.button['ghost-alt'].hover.backgroundColor};
            }

            &:active {
                background-color: ${theme.button['ghost-alt'].active.backgroundColor};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${theme.button['ghost-alt'].focus.boxShadow};
            }

            ${[
              selected &&
                `
                    box-shadow: ${boxShadow.DEFAULT};
                    background-color: ${theme.button['ghost-alt'].selected.backgroundColor};
                `,
            ].filter(Boolean)}
        `,
    ].filter(Boolean)}
    .nv-button__icon {
    pointer-events: none;
    ${({ squared }) => !squared && 'position: absolute;'}
    ${({ size, squared }) => !squared && iconStyleBySize(size)}
  }
`
