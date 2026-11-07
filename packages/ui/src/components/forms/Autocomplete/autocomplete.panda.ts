import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './autocomplete.shared'

const autocomplete = cva({
  base: {
    // Floating width follows the reference; an explicit consumer width is a CSS variable.
    minWidth: 'var(--nv-autocomplete-min-width, 18.75rem)',
    width: 'var(--reference-width)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--nv-autocomplete-border-color)',
    boxShadow: 'lg',
    overflow: 'hidden',
    backgroundColor: 'var(--nv-autocomplete-background-color)',
    '& .autocomplete__list': { maxHeight: '12.5rem', overflowY: 'auto' },
  },
  variants: {
    size: {
      sm: { borderRadius: 'sm' },
      md: { borderRadius: 'md' },
      lg: { borderRadius: 'md' },
    },
  },
  defaultVariants: { size: 'md' },
})
export const reference = cva({
  base: {
    display: 'inline-flex',
    width: '100%',
    '& > *': { minWidth: '0', flex: '1' },
  },
})
export const StAutocomplete = pandaComponent('div', props, autocomplete)
export const StAutocompleteReferenceWrapper = pandaComponent(
  'div',
  props,
  reference,
)
export const shield = cva({
  base: {
    // Consume the dismissing gesture before it can reach another application control.
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    transform: 'translate(var(--nv-shield-x, 0px), var(--nv-shield-y, 0px))',
    pointerEvents: 'auto',
    zIndex: '9999',
  },
})
// Ark writes an inline z-index variable; this primitive geometry override must
// win so the option surface stacks above the preceding shield at the same level.
export const positionerStyle = cva({ base: { zIndex: '9999 !important' } })
