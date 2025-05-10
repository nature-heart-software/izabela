/* eslint-disable */
import styled, { injectGlobal } from 'vue3-styled-components'
import { props } from './context-menu.shared'
import { borderRadiusStyleBySize } from '@/utils/css-in-js'

import { tokens } from '@/styles/tokens'
import lightTheme from '@/tokens/light'
import { rem } from 'polished'

const { boxShadow, borderWidth } = tokens

export const StContextMenu = styled('div', props)`
  ${() => injectGlobal`
    [data-theme="context-menu"] {
      box-shadow: ${boxShadow.lg} !important;
      border-color: ${lightTheme.contextMenu.borderColor} !important;
      border-width: ${rem(borderWidth.DEFAULT)};
      background-color: ${lightTheme.contextMenu.backgroundColor};
      ${borderRadiusStyleBySize('md')}
      min-width: ${rem(150)};
    }`}
`
