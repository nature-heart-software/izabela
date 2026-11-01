/* eslint-disable */
import styled, { injectGlobal } from 'vue3-styled-components'
import { props } from './context-menu.shared'
import { borderRadiusStyleBySize } from '@/utils/css-in-js'

import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { rem } from 'polished'

const { boxShadow, borderWidth } = tokens

export const StContextMenu = styled('div', props)`
  ${({ theme }) => injectGlobal`
    [data-theme="context-menu"] {
      box-shadow: ${boxShadow.lg} !important;
      border-color: ${theme.contextMenu.borderColor} !important;
      border-width: ${rem(borderWidth.DEFAULT)};
      background-color: ${theme.contextMenu.backgroundColor};
      ${borderRadiusStyleBySize('md')}
      min-width: ${rem(150)};
    }`}
`
