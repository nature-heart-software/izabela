/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './switch.shared'

const { spacing, borderWidth, colors, borderRadius, transition } = store.getters.theme
export const StSwitch = styled('span', props)`
  display: inline-flex;
  width: ${spacing['8']};
  height: ${spacing['6']};
  background-color: white;
  padding: ${spacing['2']};
  position: relative;
  border-radius: ${borderRadius.sm};
  cursor: pointer;
  transition: ${transition.DEFAULT};
  outline: 0;

  &::before {
    content: '';
    position: relative;
    display: inline-flex;
    width: ${spacing['5']};
    height: ${spacing['5']};
    border-radius: ${borderRadius.xs};
    background-color: ${colors.gray['20']};
    left: 0;
    transition: ${transition.DEFAULT};
  }

  &::after {
    content: '';
    width: 100%;
    height: 100%;
    border: ${borderWidth.DEFAULT} solid ${colors.gray['20']};
    border-radius: ${borderRadius.sm};
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    transition: ${transition.DEFAULT};
  }

  &:hover {
    &::after {
      border-color: ${colors.gray['30']};
    }
  }

  &:focus {
    box-shadow: 0 0 0 ${borderWidth.lg} ${colors.gray['10']};

    &::after {
      border-color: ${colors.gray['30']};
    }
  }

  ${({ modelValue }) =>
    modelValue &&
    `
    &::before {
      background-color: ${colors.gray['100']};
      left: ${spacing['5']};
    }
  `}
`
