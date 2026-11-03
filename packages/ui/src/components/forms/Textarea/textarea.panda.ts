import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './textarea.shared'

export const textareaRecipe = cva({
  base: {
    fontWeight: '600',
    borderWidth: '1px',
    borderStyle: 'solid',
    outline: '0',
    transition: 'all .3s',
    borderColor: 'textarea.default.border',
    color: 'textarea.default.text',
    backgroundColor: 'textarea.default.background',
    '&:hover': {
      borderColor: 'textarea.default.hover.border',
      color: 'textarea.default.hover.text',
      backgroundColor: 'textarea.default.hover.background',
    },
    '&:focus': {
      color: 'textarea.default.focus.text',
      backgroundColor: 'textarea.default.focus.background',
      boxShadow: '0 0 0 0.25rem {colors.textarea.default.focus.focus-ring}',
      borderColor: 'textarea.default.focus.border',
    },
    '&::placeholder': {
      color: 'textarea.default.placeholder',
      fontWeight: '300',
    },
    height: '10',
    paddingY: 'calc({spacing.3} - 1px)',
    lineHeight: 'default',
    letterSpacing: 'default',
  },
  variants: {
    size: {
      sm: {
        paddingX: '3',
        borderRadius: 'sm',
        borderBottomRightRadius: '0',
        fontSize: '0.75rem',
      },
      md: {
        paddingX: '5',
        borderRadius: 'md',
        borderBottomRightRadius: '0',
        fontSize: '0.75rem',
      },
      lg: {
        paddingX: '5',
        borderRadius: 'md',
        borderBottomRightRadius: '0',
        fontSize: '0.875rem',
      },
    },
  },
  defaultVariants: { size: 'md' },
})
export const StTextarea = pandaComponent(
  'textarea',
  { ...props, modelValue: {} },
  (props) => textareaRecipe(props),
)
