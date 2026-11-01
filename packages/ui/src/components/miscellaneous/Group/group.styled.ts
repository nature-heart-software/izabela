/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { props } from './group.shared'
import { rem } from 'polished'

const { spacing } = tokens
const POSITIONS = {
  start: 'flex-start',
  left: 'flex-start',
  center: 'center',
  end: 'flex-end',
  right: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  stretch: 'stretch',
  apart: 'space-between',
}

export const StGroup = styled('div', props)`
  display: flex;
  flex-flow: ${({ direction }) => direction}
    ${({ noWrap }) => (noWrap ? 'nowrap' : 'wrap')};
  ${({ justify, direction }) =>
    direction === 'row' && `justify-content: ${POSITIONS[justify]}`};
  align-items: ${({ align = props.align.default, direction, grow, justify }) =>
    direction === 'column' && grow
      ? 'stretch'
      : direction === 'column'
        ? justify === 'apart'
          ? POSITIONS['left']
          : POSITIONS[justify]
        : align};
  gap: ${({ spacing: spacingKey }) => rem(spacing[spacingKey])};

  & > * {
    flex-grow: ${({ grow }) => (grow ? 1 : 0)};
  }
`
