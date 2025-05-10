/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { props, Props, Type } from './alert.shared'
import { rem } from 'polished'
import { borderRadiusStyleBySize, paddingStyleBySize } from '@/utils/css-in-js'
import { Size } from '@/components/forms/Button/button.shared'
import { CSSObject } from '@/types/css-in-js'

const { spacing } = tokens

const typeStyle = ({ theme, type }: Props & { theme: any }): CSSObject => {
  const typeStyles: Record<Type, CSSObject> = {
    info: {
      backgroundColor: theme.alert.info.backgroundColor,
      color: theme.alert.info.color,
    },
    success: {
      backgroundColor: theme.alert.success.backgroundColor,
      color: theme.alert.success.color,
    },
    warning: {
      backgroundColor: theme.alert.warning.backgroundColor,
      color: theme.alert.warning.color,
    },
    error: {
      backgroundColor: theme.alert.error.backgroundColor,
      color: theme.alert.error.color,
    },
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
  ${styleBySize}
  ${typeStyle}
  ${() => borderRadiusStyleBySize('sm')}
`
