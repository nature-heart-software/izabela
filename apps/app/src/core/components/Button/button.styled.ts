/* eslint-disable */
import styled, { Styled } from 'vue3-styled-components'
import store from '@/store'
import { props, Props, Size } from './button.shared'
import { CSSObject } from '@/types/css-in-js'

const { spacing, borderWidth, borderRadius, fontSize, colors, transition, boxShadow } =
  store.getters.theme

const getStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    xs: {
      padding: `0 ${ spacing['2'] }`,
      height: spacing['5'],
      borderRadius: borderRadius.xs,
      '> * + *': {
        marginLeft: spacing['2'],
      },
    },
    sm: {
      padding: `0 ${ spacing['3'] }`,
      height: spacing['6'],
      borderRadius: borderRadius.sm,
      '> * + *': {
        marginLeft: spacing['2'],
      },
    },
    md: {
      padding: `0 ${ spacing['5'] }`,
      height: spacing['7'],
      '> * + *': {
        marginLeft: spacing['3'],
      },
    },
    lg: {
      fontSize: fontSize['2'][0],
      padding: `0 ${ spacing['5'] }`,
      height: spacing['8'],
      '> * + *': {
        marginLeft: spacing['3'],
      },
    },
  }
  return styles[size]
}

const getStyleFromSquared = ({ squared, size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    xs: {
      width: squared && spacing['5'],
    },
    sm: {
      width: squared && spacing['6'],
    },
    md: {
      width: squared && spacing['7'],
    },
    lg: {
      width: squared && spacing['8'],
    },
  }

  return styles[size]
}

export const StButton = styled('button', props)`
  display: inline-flex;
  align-items: center;
  font-size: ${ fontSize['1'][0] };
  ${ fontSize['1'][1] }
  font-weight: 600;
  border-radius: ${ borderRadius.DEFAULT };
  border-width: ${ borderWidth.DEFAULT };
  outline: 0;
  transition: ${ transition.DEFAULT };
  ${ (parameter) => getStyleFromSize(parameter) }
  ${ ({ squared }) =>
    squared &&
    `
        padding: 0;
        justify-content: center;
    ` }
  ${ (parameter) => getStyleFromSquared(parameter) }
  ${ ({ type, selected }) =>
    [
      type === 'default' &&
      `
            background-color: ${ colors.white };
            border-color: ${ colors.gray['20'] };
            &:hover {
                background-color: ${ colors.gray['10'] };
            }

            &:active {
                background-color: ${ colors.gray['30'] };
            }

            &:focus {
                box-shadow: 0 0 0 ${ borderWidth.lg } ${ colors.gray['10'] };
            }

            ${ [
        selected &&
        `
                    background-color: ${ colors.gray['20'] };
                `,
      ].filter(Boolean) }
        `,
      type === 'plain' &&
      `
            color: ${ colors.white };
            background-color: ${ colors.gray['100'] };
            border-color: ${ colors.gray['100'] };
            &:hover {
                border-color: ${ colors.gray['90'] };
                background-color: ${ colors.gray['90'] };
            }

            &:active {
                border-color: ${ colors.gray['70'] };
                background-color: ${ colors.gray['70'] };
            }

            &:focus {
                box-shadow: 0 0 0 ${ borderWidth.lg } ${ colors.gray['70'] };
            }

            ${ [
        selected &&
        `
                    border-color: ${ colors.gray['80'] };
                    background-color: ${ colors.gray['80'] };
                `,
      ].filter(Boolean) }
        `,
      type === 'ghost' &&
      `
            background-color: transparent;
            border-color: transparent;
            &:hover {
                background-color: ${ colors.gray['10'] };
            }

            &:active {
                background-color: ${ colors.gray['30'] };
            }

            &:focus {
                box-shadow: 0 0 0 ${ borderWidth.lg } ${ colors.gray['10'] };
            }

            ${ [
        selected &&
        `
                    background-color: ${ colors.gray['20'] };
                `,
      ].filter(Boolean) }
        `,
      type === 'ghost-alt' &&
      `
            background-color: transparent;
            border-color: transparent;
            &:hover {
                background-color: ${ colors.gray['20'] };
            }

            &:active {
                background-color: ${ colors.gray['30'] };
            }

            &:focus {
                box-shadow: 0 0 0 ${ borderWidth.lg } ${ colors.gray['10'] };
            }

            ${ [
        selected &&
        `
                    box-shadow: ${ boxShadow.DEFAULT };
                    background-color: ${ colors.gray['0'] };
                `,
      ].filter(Boolean) }
        `,
    ].filter(Boolean) }
`
