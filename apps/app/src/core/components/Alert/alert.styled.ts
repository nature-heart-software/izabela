/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props, Props, Type } from './alert.shared'
import { Properties } from 'csstype'
import { rem } from 'polished'
import { borderRadiusStyleBySize } from '@/utils/css-in-js'

const { spacing, colors } = tokens
const typeStyle = ({ type }: Props): Properties => {
  const typeStyles: Record<Type, Properties> = {
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
export const StAlert = styled('div', props)`
  padding-top: ${() => rem(spacing['2'])};
  padding-left: ${() => rem(spacing['3'])};
  padding-right: ${() => rem(spacing['3'])};
  padding-bottom: ${() => rem(spacing['2'])};
  ${typeStyle}
  ${() => borderRadiusStyleBySize('sm')}
`
