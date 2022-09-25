/* eslint-disable */
import styled from 'vue3-styled-components'
import tokens from '@/styles/tokens'
import { props } from './access-blocker.shared'
import { disabledItemBackgroundStyle } from '@/utils/css-in-js'

const {} = tokens
export const StAccessBlocker = styled('div', props)`
  position: relative;
`
export const StAccessBlockerReason = styled('div', props)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  ${disabledItemBackgroundStyle}
`
