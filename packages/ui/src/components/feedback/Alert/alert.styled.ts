/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { props, Props, Type } from './alert.shared'
import { rem } from 'polished'
import { borderRadiusStyleBySize, paddingStyleBySize } from '@/utils/css-in-js'
import { Size } from '@/components/forms/Button/button.shared'
import { CSSObject } from '@/types/css-in-js'

const { spacing, colors } = tokens

const typeStyle = ({ type }: Props): CSSObject => {
    const typeStyles: Record<Type, CSSObject> = {
        info: {
            backgroundColor: colors.black,
            color: colors.white,
        },
        success: {},
        warning: {},
        error: {},
    }
    return typeStyles[type]
}

const styleBySize = ({ size }: Props) => {
    const horizontalPadding = paddingStyleBySize(size)
    const borderRadius = borderRadiusStyleBySize(size)
    const styles: Record<Size, CSSObject> = {
        xs: {
            ...borderRadius,
            ...horizontalPadding,
            minHeight: rem(spacing['5']),
        },
        sm: {
            ...borderRadius,
            ...horizontalPadding,
            minHeight: rem(spacing['6']),
        },
        md: {
            ...borderRadius,
            ...horizontalPadding,
            minHeight: rem(spacing['7']),
        },
        lg: {
            ...borderRadius,
            ...horizontalPadding,
            minHeight: rem(spacing['8']),
        },
    }
    return styles[size]
}

export const StAlert = styled('div', props)`
  ${ styleBySize }
  ${ typeStyle }
  ${ () => borderRadiusStyleBySize('sm') }
`
