import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './range-input.shared'

export const rangeInputRecipe = cva({
  base: {
    appearance: 'none',
    background: 'transparent',
    cursor: 'pointer',
    width: '15rem',
    '&:focus': { outline: 'none' },
    '&:hover::-webkit-slider-runnable-track': {
      backgroundColor: 'range-input.default.hover.track-background',
    },
    '&:active::-webkit-slider-runnable-track': {
      backgroundColor: 'range-input.default.pressed.track-background',
    },
    '&:focus::-webkit-slider-runnable-track': {
      backgroundColor: 'range-input.default.focus.track-background',
    },
    '&::-webkit-slider-runnable-track': {
      backgroundColor: 'range-input.default.track-background',
      height: '2',
    },
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      marginTop: 'calc(({spacing.2} - {spacing.4}) / 2)',
      height: '4',
      width: '4',
      borderRadius: 'md',
      backgroundColor: 'range-input.default.thumb-background',
      borderColor: 'range-input.default.thumb-border',
    },
    '&:hover::-webkit-slider-thumb': {
      borderColor: 'range-input.default.hover.thumb-border',
      backgroundColor: 'range-input.default.hover.thumb-background',
    },
    '&:active::-webkit-slider-thumb': {
      borderColor: 'range-input.default.pressed.thumb-border',
      backgroundColor: 'range-input.default.pressed.thumb-background',
    },
    '&:focus::-webkit-slider-thumb': {
      border: '1px solid {colors.range-input.default.focus.thumb-border}',
      boxShadow:
        '0 0 0 0.25rem {colors.range-input.default.thumb-focus.focus-ring}',
    },
    '&:hover::-moz-range-track': {
      backgroundColor: 'range-input.default.hover.track-background',
    },
    '&:active::-moz-range-track': {
      backgroundColor: 'range-input.default.pressed.track-background',
    },
    '&:focus::-moz-range-track': {
      backgroundColor: 'range-input.default.focus.track-background',
    },
    '&::-moz-range-track': {
      backgroundColor: 'range-input.default.track-background',
      height: '2',
    },
    '&::-moz-range-thumb': {
      height: '4',
      width: '4',
      borderRadius: 'md',
      backgroundColor: 'range-input.default.thumb-background',
      borderColor: 'range-input.default.thumb-border',
    },
    '&:hover::-moz-range-thumb': {
      borderColor: 'range-input.default.hover.thumb-border',
      backgroundColor: 'range-input.default.hover.thumb-background',
    },
    '&:active::-moz-range-thumb': {
      borderColor: 'range-input.default.pressed.thumb-border',
      backgroundColor: 'range-input.default.pressed.thumb-background',
    },
    '&:focus::-moz-range-thumb': {
      border: '1px solid {colors.range-input.default.focus.thumb-border}',
      boxShadow:
        '0 0 0 0.25rem {colors.range-input.default.thumb-focus.focus-ring}',
    },
  },
})
export const StRangeInput = pandaComponent('input', props, () =>
  rangeInputRecipe(),
)
