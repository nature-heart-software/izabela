/* eslint-disable */
import styled, { Styled } from 'vue3-styled-components'
import store from '@/store'
import { props, Props, Size } from './button.shared'
import { CSSObject } from '@/types/css-in-js'

const {
  space,
  borderWidth,
  borderRadius,
  fontSize,
  colors,
} = store.getters.theme

const getStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    xs: {
      padding: `0 ${space['2']}`,
      height: space['5'],
      borderRadius: borderRadius.xs,
      '> * + *': {
        marginLeft: space['2'],
      },
    },
    sm: {
      padding: `0 ${space['3']}`,
      height: space['6'],
      borderRadius: borderRadius.sm,
      '> * + *': {
        marginLeft: space['2'],
      },
    },
    md: {
      padding: `0 ${space['5']}`,
      height: space['7'],
      '> * + *': {
        marginLeft: space['3'],
      },
    },
    lg: {
      padding: `0 ${space['5']}`,
      height: space['8'],
      '> * + *': {
        marginLeft: space['3'],
      },
    },
  }
  return styles[size]
}

const getStyleFromSquared = ({ squared, size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    xs: {
      width: squared && space['5'],
    },
    sm: {
      width: squared && space['6'],
    },
    md: {
      width: squared && space['7'],
    },
    lg: {
      width: squared && space['8'],
    },
  }

  return styles[size]
}

export const StButton = styled('button', props)`
  display: inline-flex;
  align-items: center;
  font-size: ${fontSize['1'][0]};
  ${fontSize['1'][1]}
  border-radius: ${borderRadius.DEFAULT};
  border-width: ${borderWidth.DEFAULT};
  outline: 0;
  ${(parameter) => getStyleFromSize(parameter)}
  ${({ squared }) =>
    squared &&
    `
        padding: 0;
        justify-content: center;
    `}
    ${(parameter) => getStyleFromSquared(parameter)}
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
                box-shadow: 0 0 0 ${borderWidth.lg} ${colors.gray['10']};
            }

            ${[
        selected &&
        `
                    background-color: ${colors.gray['20']};
                `,
      ]}
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
                box-shadow: 0 0 0 ${borderWidth.lg} ${colors.gray['70']};
            }

            ${[
        selected &&
        `
                    border-color: ${colors.gray['80']};
                    background-color: ${colors.gray['80']};
                `,
      ]}
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
                box-shadow: 0 0 0 ${borderWidth.lg} ${colors.gray['10']};
            }

            ${[
        selected &&
        `
                    background-color: ${colors.gray['20']};
                `,
      ]}
        `,
    ].filter(Boolean)}
`
