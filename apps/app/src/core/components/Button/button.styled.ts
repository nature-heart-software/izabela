import styled, { Styled } from 'vue3-styled-components'
import store from '@/store'
import { props, Props, Size } from './button.shared'
import { CSSObject } from '@/types/css-in-js'

const theme = store.getters['theme']

const getStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    xs: {
      padding: `0 ${theme.space['2']}`,
      height: theme.space['5'],
      borderRadius: theme.borderRadius.xs,
      '> * + *': {
        marginLeft: theme.space['2'],
      },
    },
    sm: {
      padding: `0 ${theme.space['3']}`,
      height: theme.space['6'],
      borderRadius: theme.borderRadius.sm,
      '> * + *': {
        marginLeft: theme.space['2'],
      },
    },
    md: {
      padding: `0 ${theme.space['5']}`,
      height: theme.space['7'],
      '> * + *': {
        marginLeft: theme.space['3'],
      },
    },
    lg: {
      padding: `0 ${theme.space['5']}`,
      height: theme.space['8'],
      '> * + *': {
        marginLeft: theme.space['3'],
      },
    },
  }
  return styles[size]
}

const getStyleFromSquared = ({ squared, size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    xs: {
      width: squared && theme.space['5'],
    },
    sm: {
      width: squared && theme.space['6'],
    },
    md: {
      width: squared && theme.space['7'],
    },
    lg: {
      width: squared && theme.space['8'],
    },
  }

  return styles[size]
}

export const StButton = styled('button', props)`
  display: inline-flex;
  align-items: center;
  font-size: ${theme.fontSize['1'][0]};
  ${theme.fontSize['1'][1]}
  border-radius: ${theme.borderRadius.DEFAULT};
  border-width: ${theme.borderWidth.DEFAULT};
  outline: 0;
  ${(props) => getStyleFromSize(props)}
  ${({ squared }) =>
    squared &&
    `
        padding: 0;
        justify-content: center;
    `}
    ${(props) => getStyleFromSquared(props)}
    ${({ type, selected }) =>
    [
      type === 'default' &&
        `
            background-color: ${theme.colors.white};
            border-color: ${theme.colors.gray['20']};
            &:hover {
                background-color: ${theme.colors.gray['10']};
            }

            &:active {
                background-color: ${theme.colors.gray['30']};
            }

            &:focus {
                box-shadow: 0 0 0 ${theme.borderWidth.lg} ${theme.colors.gray['10']};
            }

            ${[
              selected &&
                `
                    background-color: ${theme.colors.gray['20']};
                `,
            ]}
        `,
      type === 'plain' &&
        `
            color: ${theme.colors.white};
            background-color: ${theme.colors.gray['100']};
            border-color: ${theme.colors.gray['100']};
            &:hover {
                border-color: ${theme.colors.gray['90']};
                background-color: ${theme.colors.gray['90']};
            }

            &:active {
                border-color: ${theme.colors.gray['70']};
                background-color: ${theme.colors.gray['70']};
            }

            &:focus {
                box-shadow: 0 0 0 ${theme.borderWidth.lg} ${theme.colors.gray['70']};
            }

            ${[
              selected &&
                `
                    border-color: ${theme.colors.gray['80']};
                    background-color: ${theme.colors.gray['80']};
                `,
            ]}
        `,
      type === 'ghost' &&
        `
            background-color: transparent;
            border-color: transparent;
            &:hover {
                background-color: ${theme.colors.gray['10']};
            }

            &:active {
                background-color: ${theme.colors.gray['30']};
            }

            &:focus {
                box-shadow: 0 0 0 ${theme.borderWidth.lg} ${theme.colors.gray['10']};
            }

            ${[
              selected &&
                `
                    background-color: ${theme.colors.gray['20']};
                `,
            ]}
        `,
    ].filter(Boolean)}
`
