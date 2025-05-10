/* eslint-disable */
import styled, { injectGlobal } from 'vue3-styled-components'
import { props } from './tooltip.shared'
import { borderRadiusStyleBySize } from '@/utils/css-in-js'

import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { rem } from 'polished'

const { boxShadow, borderWidth, spacing } = tokens

export const StTooltip = styled('div', props)`
  ${({theme}) => injectGlobal`
    [data-theme="tooltip"] {
      box-shadow: ${boxShadow.lg} !important;
      border-color: ${theme.tooltip.borderColor} !important;
      border-width: ${rem(borderWidth.DEFAULT)};
      color: ${theme.tooltip.color} !important;
      background-color: ${theme.tooltip.backgroundColor} !important;
      padding: ${rem(spacing[1])} ${rem(spacing[2])};
      ${borderRadiusStyleBySize('xs')}
    }
  `}
`
