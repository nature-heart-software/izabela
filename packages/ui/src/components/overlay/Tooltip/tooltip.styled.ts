/* eslint-disable */
import styled, { injectGlobal } from 'vue3-styled-components'
import { props } from './tooltip.shared'
import { borderRadiusStyleBySize } from '@/utils/css-in-js'

import tokens from '@/styles/tokens'
import { rem } from 'polished'

const { boxShadow, colors, borderWidth, spacing } = tokens

export const StTooltip = styled('div', props)`
  ${() => injectGlobal`
    [data-theme="tooltip"] {
      box-shadow: ${boxShadow.lg} !important;
      border-color: ${colors.black} !important;
      border-width: ${rem(borderWidth.DEFAULT)};
      color: ${colors.white} !important;
      background-color: ${colors.black} !important;
      padding: ${rem(spacing[1])} ${rem(spacing[2])};
      ${borderRadiusStyleBySize('xs')}
    }
  `}
`
