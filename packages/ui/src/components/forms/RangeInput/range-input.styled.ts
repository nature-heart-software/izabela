/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { props } from './range-input.shared'
import { rem } from 'polished'

const { spacing, borderWidth, borderRadius, transition } = tokens
export const StRangeInput = styled('input', props)`
  /********** Range Input Styles **********/
  /*Range Reset*/

  & {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    width: 15rem;
  }

  /* Removes default focus */

  &:focus {
    outline: none;
  }

  /***** Chrome, Safari, Opera and Edge Chromium styles *****/
  /* slider track */

  &::-webkit-slider-runnable-track {
    background-color: ${({ theme }) => theme.rangeInput.trackColor};
    height: ${() => rem(spacing['2'])};
  }

  /* slider thumb */

  &::-webkit-slider-thumb {
    -webkit-appearance: none; /* Override default look */
    appearance: none;
    margin-top: ${() =>
      rem(
        -(spacing['4'] / 2) + spacing['2'] / 2,
      )}; /* Centers thumb on the track */

    /*custom styles*/
    height: ${() => rem(spacing['4'])};
    width: ${() => rem(spacing['4'])};
    border-radius: ${() => rem(borderRadius.DEFAULT)};

    background-color: ${({ theme }) => theme.rangeInput.thumbColor};
    border-color: ${({ theme }) => theme.rangeInput.thumbColor};

    &:hover {
      border-color: ${({ theme }) => theme.rangeInput.thumbHoverColor};
      background-color: ${({ theme }) => theme.rangeInput.thumbHoverColor};
    }

    &:active {
      border-color: ${({ theme }) => theme.rangeInput.thumbActiveColor};
      background-color: ${({ theme }) => theme.rangeInput.thumbActiveColor};
    }

    &:focus {
      box-shadow: 0 0 0 ${() => rem(borderWidth.lg)}
        ${({ theme }) => theme.rangeInput.thumbFocusBoxShadow};
    }
  }

  &:focus::-webkit-slider-thumb {
    border: ${() => rem(borderWidth['DEFAULT'])} solid
      ${({ theme }) => theme.rangeInput.thumbFocusBorderColor};
  }
`
