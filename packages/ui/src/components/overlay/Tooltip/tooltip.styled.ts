/* eslint-disable */
import styled, { injectGlobal } from 'vue3-styled-components'
import { props } from './tooltip.shared'
import { borderRadiusStyleBySize } from '@/utils/css-in-js'

import { tokens } from '@/styles/tokens'
import lightTheme from '@/tokens/light'
import { rem } from 'polished'

const { boxShadow, borderWidth, spacing } = tokens

export const StTooltip = styled('div', props)`
  ${() => injectGlobal`
    [data-theme="tooltip"] {
      box-shadow: ${boxShadow.lg} !important;
      border-color: ${lightTheme.tooltip.borderColor} !important;
      border-width: ${rem(borderWidth.DEFAULT)};
      color: ${lightTheme.tooltip.color} !important;
      background-color: ${lightTheme.tooltip.backgroundColor} !important;
      padding: ${rem(spacing[1])} ${rem(spacing[2])};
      ${borderRadiusStyleBySize('xs')}
    }
  `}
`
