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
    '&::-webkit-slider-runnable-track': {
      backgroundColor: 'var(--nv-range-input-track-color)',
      height: '2',
    },
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      marginTop: 'calc(({spacing.2} - {spacing.4}) / 2)',
      height: '4',
      width: '4',
      borderRadius: 'md',
      backgroundColor: 'var(--nv-range-input-thumb-color)',
      borderColor: 'var(--nv-range-input-thumb-color)',
    },
    '&:hover::-webkit-slider-thumb': {
      borderColor: 'var(--nv-range-input-thumb-hover-color)',
      backgroundColor: 'var(--nv-range-input-thumb-hover-color)',
    },
    '&:active::-webkit-slider-thumb': {
      borderColor: 'var(--nv-range-input-thumb-active-color)',
      backgroundColor: 'var(--nv-range-input-thumb-active-color)',
    },
    '&:focus::-webkit-slider-thumb': {
      border: '1px solid var(--nv-range-input-thumb-focus-border-color)',
      boxShadow: '0 0 0 0.25rem var(--nv-range-input-thumb-focus-box-shadow)',
    },
    '&::-moz-range-track': {
      backgroundColor: 'var(--nv-range-input-track-color)',
      height: '2',
    },
    '&::-moz-range-thumb': {
      height: '4',
      width: '4',
      borderRadius: 'md',
      backgroundColor: 'var(--nv-range-input-thumb-color)',
      borderColor: 'var(--nv-range-input-thumb-color)',
    },
    '&:hover::-moz-range-thumb': {
      borderColor: 'var(--nv-range-input-thumb-hover-color)',
      backgroundColor: 'var(--nv-range-input-thumb-hover-color)',
    },
    '&:active::-moz-range-thumb': {
      borderColor: 'var(--nv-range-input-thumb-active-color)',
      backgroundColor: 'var(--nv-range-input-thumb-active-color)',
    },
    '&:focus::-moz-range-thumb': {
      border: '1px solid var(--nv-range-input-thumb-focus-border-color)',
      boxShadow: '0 0 0 0.25rem var(--nv-range-input-thumb-focus-box-shadow)',
    },
  },
})
export const StRangeInput = pandaComponent('input', props, () =>
  rangeInputRecipe(),
)
