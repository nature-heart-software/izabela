import { sva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './input.shared'

// The native input and its adornments share one focus ring and size contract.
export const inputRecipe = sva({
  slots: ['root', 'control', 'input', 'adornment', 'action'],
  base: {
    root: { display: 'inline-flex', minWidth: '0' },
    control: {
      display: 'inline-flex',
      position: 'relative',
      alignItems: 'center',
      width: '100%',
      minWidth: '0',
    },
    input: {
      width: '100%',
      minWidth: '0',
      fontWeight: '600',
      borderWidth: '1px',
      borderStyle: 'solid',
      outline: '0',
      borderColor: 'input.default.border',
      transition: 'all .3s',
      color: 'input.default.text',
      backgroundColor: 'input.default.background',
      '&:hover': {
        borderColor: 'input.default.hover.border',
        color: 'input.default.hover.text',
        backgroundColor: 'input.default.hover.background',
      },
      '&:focus': {
        color: 'input.default.focus.text',
        backgroundColor: 'input.default.focus.background',
        boxShadow: '0 0 0 0.25rem {colors.input.default.focus.focus-ring}',
        borderColor: 'input.default.focus.border',
      },
      '&::placeholder': {
        color: 'input.default.placeholder',
        fontWeight: '300',
      },
      '&[type="password"]': { paddingRight: '7' },
      '&[data-prefix]': { paddingLeft: '7' },
      '&[data-suffix]': { paddingRight: '7' },
    },
    adornment: {
      position: 'absolute',
      display: 'inline-flex',
      alignItems: 'center',
      '&[data-position="prefix"]': { left: '3' },
      '&[data-position="suffix"]': { right: '3' },
    },
    action: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      border: '0',
      color: 'input.default.text',
      background: 'transparent',
      cursor: 'pointer',
      '&:focus-visible': {
        outline: '2px solid currentColor',
        outlineOffset: '2px',
      },
    },
  },
  variants: {
    size: {
      sm: {
        input: {
          height: '6',
          paddingX: '3',
          borderRadius: 'sm',
          fontSize: '0.75rem',
          lineHeight: 'default',
          letterSpacing: 'default',
        },
      },
      md: {
        input: {
          height: '7',
          paddingX: '5',
          borderRadius: 'md',
          fontSize: '0.75rem',
          lineHeight: 'default',
          letterSpacing: 'default',
        },
      },
      lg: {
        input: {
          height: '8',
          paddingX: '5',
          borderRadius: 'md',
          fontSize: '0.875rem',
          lineHeight: 'default',
          letterSpacing: 'default',
        },
      },
    },
  },
  defaultVariants: { size: 'md' },
})
export const StInput = pandaComponent(
  'div',
  props,
  (props) => inputRecipe(props).root,
)
