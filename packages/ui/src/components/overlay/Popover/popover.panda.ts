import { Popover } from '@ark-ui/vue'
import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './popover.shared'

export const StPopover = pandaComponent('div', props, cva({ base: {} }))
export const StPopoverPositioner = pandaComponent(
  Popover.Positioner,
  {},
  // Ark positions with an inline z-index variable; keep the surface above its shield.
  cva({ base: { zIndex: '9999 !important' } }),
)
export const StPopoverContent = pandaComponent(
  Popover.Content,
  props,
  cva({
    base: {
      // The portalled primitive owns the surface and its maximum width.
      maxWidth: '18.75rem',
      outline: 'none',
    },
    variants: {
      size: {
        sm: {
          '& > *': {
            backgroundColor: 'popover.sm.background',
            boxShadow: 'popover.sm.shadow',
          },
        },
        md: {
          '& > *': {
            backgroundColor: 'popover.md.background',
            boxShadow: 'popover.md.shadow',
          },
        },
        lg: {
          '& > *': {
            backgroundColor: 'popover.lg.background',
            boxShadow: 'popover.lg.shadow',
          },
        },
      },
    },
    defaultVariants: { size: 'md' },
  }),
)
export const popoverShield = cva({
  base: {
    // Preserve a viewport-sized hit-test boundary even when nested in a dialog.
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    pointerEvents: 'auto',
  },
})
