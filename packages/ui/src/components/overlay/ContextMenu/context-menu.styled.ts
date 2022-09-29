/* eslint-disable */
import styled, { injectGlobal } from 'vue3-styled-components'
import { props } from './context-menu.shared'
import { borderRadiusStyleBySize } from '@/utils/css-in-js'

import tokens from '@/styles/tokens'
import { rem } from 'polished'

const { boxShadow, colors, borderWidth } = tokens

export const StContextMenu = styled('div', props)`
  ${() => injectGlobal`
    [data-theme="context-menu"] {
      box-shadow: ${boxShadow.lg} !important;
      border-color: ${colors.gray['20']} !important;
      border-width: ${rem(borderWidth.DEFAULT)};
      background-color: white;
      ${borderRadiusStyleBySize('md')}
      min-width: ${rem(150)};
    }`}
`
