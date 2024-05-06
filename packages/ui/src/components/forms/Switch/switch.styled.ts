/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { props } from './switch.shared'
import { rem } from 'polished'

const { spacing, borderWidth, colors, borderRadius, transition } = tokens
export const StSwitch = styled('span', props)`
  display: inline-flex;
  width: ${ () => rem(spacing['8']) };
  height: ${ () => rem(spacing['6']) };
  background-color: white;
  padding: ${ () => rem(spacing['2']) };
  position: relative;
  border-radius: ${ () => rem(borderRadius.sm) };
  cursor: pointer;
  transition: ${ () => transition.DEFAULT };
  outline: 0;

  &::before {
    content: '';
    position: relative;
    display: inline-flex;
    width: ${ () => rem(spacing['5']) };
    height: ${ () => rem(spacing['5']) };
    border-radius: ${ () => rem(borderRadius.xs) };
    background-color: ${ () => colors.gray['20'] };
    left: 0;
    transition: ${ () => transition.DEFAULT };
  }

  &::after {
    content: '';
    width: 100%;
    height: 100%;
    border: ${ () => rem(borderWidth.DEFAULT) } solid ${ () => colors.gray['20'] };
    border-radius: ${ () => rem(borderRadius.sm) };
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    transition: ${ () => transition.DEFAULT };
  }

  &:hover {
    &::after {
      border-color: ${ () => colors.gray['30'] };
    }
  }

  &:focus {
    box-shadow: 0 0 0 ${ () => rem(borderWidth.lg) } ${ () => colors.gray['10'] };

    &::after {
      border-color: ${ () => colors.gray['30'] };
    }
  }

  ${ ({ modelValue }) =>
    modelValue &&
    `
    &::before {
      background-color: ${ colors.gray['100'] };
      left: ${ rem(spacing['5']) };
    }
  ` }
`
