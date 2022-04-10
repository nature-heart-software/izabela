/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './group.shared'

const { spacing } = store.getters.theme
const POSITIONS = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
  apart: 'space-between',
}
export const StGroup = styled('div', props)`
  display: flex;
  flex-flow: ${({ direction }) => direction} ${({ noWrap }) => (noWrap ? 'nowrap' : 'wrap')};
  ${({ position, direction }) => direction === 'row' && `justify-content: ${POSITIONS[position]}`};
  align-items: ${({ align = props.align.default, direction, grow, position }) =>
    direction === 'column' && grow
      ? 'stretch'
      : direction === 'column'
      ? position === 'apart'
        ? POSITIONS['left']
        : POSITIONS[position]
      : align};
  gap: ${({ spacing: spacingKey }) => spacing[spacingKey]};

  & > * {
    flex-grow: ${({ grow }) => (grow ? 1 : 0)};
  }
`
