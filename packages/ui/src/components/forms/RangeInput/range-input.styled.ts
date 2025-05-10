/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import lightTheme from '@/tokens/light'
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
    background-color: ${() => lightTheme.rangeInput.trackColor};
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

    background-color: ${() => lightTheme.rangeInput.thumbColor};
    border-color: ${() => lightTheme.rangeInput.thumbColor};

    &:hover {
      border-color: ${() => lightTheme.rangeInput.thumbHoverColor};
      background-color: ${() => lightTheme.rangeInput.thumbHoverColor};
    }

    &:active {
      border-color: ${() => lightTheme.rangeInput.thumbActiveColor};
      background-color: ${() => lightTheme.rangeInput.thumbActiveColor};
    }

    &:focus {
      box-shadow: 0 0 0 ${() => rem(borderWidth.lg)}
        ${() => lightTheme.rangeInput.thumbFocusBoxShadow};
    }
  }

  &:focus::-webkit-slider-thumb {
    border: ${() => rem(borderWidth['DEFAULT'])} solid
      ${() => lightTheme.rangeInput.thumbFocusBorderColor};
  }
`
