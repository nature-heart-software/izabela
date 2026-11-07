import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './number-input.shared'

export const numberInputRecipe = cva({
  base: {
    display: 'inline-flex',
    width: 'min-content',
    minWidth: '11',
    '& > *': { width: '100%' },
    '& input': {
      minWidth: '11',
      color: 'var(--nv-number-input-color)',
      backgroundColor: 'var(--nv-number-input-background-color)',
      borderColor: 'var(--nv-number-input-border-color)',
      '&:hover': { borderColor: 'var(--nv-number-input-hover-border-color)' },
      '&:focus': {
        borderColor: 'var(--nv-number-input-focus-border-color)',
        boxShadow: '0 0 0 0.25rem var(--nv-number-input-focus-box-shadow)',
      },
      '&::placeholder': { color: 'var(--nv-number-input-placeholder-color)' },
    },
  },
})
export const StNumberInput = pandaComponent('div', props, () =>
  numberInputRecipe(),
)
