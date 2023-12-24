/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
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

const { spacing, borderWidth, fontSize, colors, transition, boxShadow } = tokens

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
  ${({ type, selected }) =>
    [
      type === 'default' &&
        `
            background-color: ${colors.white};
            border-color: ${colors.gray['20']};
            &:hover {
                background-color: ${colors.gray['10']};
            }

            &:active {
                background-color: ${colors.gray['30']};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${colors.gray['10']};
            }

            ${[
              selected &&
                `
                    background-color: ${colors.gray['20']};
                `,
            ].filter(Boolean)}
        `,
      type === 'active' &&
        `
            background-color: ${colors.white};
            border-color: ${colors.gray['100']};
            &:hover {
                background-color: ${colors.gray['10']};
            }

            &:active {
                background-color: ${colors.gray['30']};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${colors.gray['10']};
            }

            ${[
          selected &&
          `
                    background-color: ${colors.gray['20']};
                `,
        ].filter(Boolean)}
        `,
      type === 'plain' &&
        `
            color: ${colors.white};
            background-color: ${colors.gray['100']};
            border-color: ${colors.gray['100']};
            &:hover {
                border-color: ${colors.gray['90']};
                background-color: ${colors.gray['90']};
            }

            &:active {
                border-color: ${colors.gray['70']};
                background-color: ${colors.gray['70']};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${colors.gray['70']};
            }

            ${[
              selected &&
                `
                    border-color: ${colors.gray['80']};
                    background-color: ${colors.gray['80']};
                `,
            ].filter(Boolean)}
        `,
      type === 'ghost' &&
        `
            background-color: transparent;
            border-color: transparent;
            &:hover {
                background-color: ${colors.gray['10']};
            }

            &:active {
                background-color: ${colors.gray['30']};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${colors.gray['10']};
            }

            ${[
              selected &&
                `
                    background-color: ${colors.gray['20']};
                `,
            ].filter(Boolean)}
        `,
      type === 'ghost-alt' &&
        `
            background-color: transparent;
            border-color: transparent;
            &:hover {
                background-color: ${colors.gray['20']};
            }

            &:active {
                background-color: ${colors.gray['30']};
            }

            &:focus {
                box-shadow: 0 0 0 ${rem(borderWidth.lg)} ${colors.gray['10']};
            }

            ${[
              selected &&
                `
                    box-shadow: ${boxShadow.DEFAULT};
                    background-color: ${colors.gray['0']};
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
