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
      color: 'number-input.default.text',
      backgroundColor: 'number-input.default.background',
      borderColor: 'number-input.default.border',
      '&:hover': {
        borderColor: 'number-input.default.hover.border',
        color: 'number-input.default.hover.text',
        backgroundColor: 'number-input.default.hover.background',
      },
      '&:focus': {
        color: 'number-input.default.focus.text',
        backgroundColor: 'number-input.default.focus.background',
        borderColor: 'number-input.default.focus.border',
        boxShadow:
          '0 0 0 0.25rem {colors.number-input.default.focus.focus-ring}',
      },
      '&::placeholder': { color: 'number-input.default.placeholder' },
    },
  },
})
export const StNumberInput = pandaComponent('div', props, () =>
  numberInputRecipe(),
)
