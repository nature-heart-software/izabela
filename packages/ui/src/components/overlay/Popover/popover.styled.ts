/* eslint-disable */
import styled, { injectGlobal } from 'vue3-styled-components'
import { props, Props, Size } from './popover.shared'
import { borderRadiusStyleBySize, paddingStyleBySize } from '@/utils/css-in-js'
import { CSSObject } from '@/types/css-in-js'

import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { rem } from 'polished'

const { boxShadow, borderWidth } = tokens

const popperStyleBySize = ({ size }: Props) => {
  const borderRadius = borderRadiusStyleBySize(size)
  const styles: Record<Size, CSSObject> = {
    sm: {
      ...borderRadius,
    },
    md: {
      ...borderRadius,
    },
    lg: {
      ...borderRadius,
    },
  }
  return styles[size]
}

export const StPopover = styled('div', props)`
  ${(props) => injectGlobal`
  [data-theme="popover-${props.size}"] {
    box-shadow: ${boxShadow.lg} !important;
    border-color: ${props.theme.popover.borderColor} !important;
    border-width: ${rem(borderWidth.DEFAULT)};
    background-color: ${props.theme.popover.backgroundColor};
    ${paddingStyleBySize(props.size)}
    ${popperStyleBySize(props)}
  }`}
`
