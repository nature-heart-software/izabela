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
    borderColor: 'var(--nv-input-border-color)',
    color: 'var(--nv-input-color)',
    backgroundColor: 'var(--nv-input-background-color)',
    '&:hover': { borderColor: 'var(--nv-input-hover-border-color)' },
    '&:focus': {
      boxShadow: '0 0 0 0.25rem var(--nv-input-focus-box-shadow)',
      borderColor: 'var(--nv-input-focus-border-color)',
    },
    '&::placeholder': {
      color: 'var(--nv-input-placeholder-color)',
      fontWeight: '300',
    },
    height: '10',
    paddingY: 'calc({spacing.3} - 1px)',
    lineHeight: '1.4',
    letterSpacing: '0.02rem',
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
