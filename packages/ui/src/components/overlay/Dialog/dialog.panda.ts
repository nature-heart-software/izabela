import { Dialog } from '@ark-ui/vue'
import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'

export const StDialogTrigger = pandaComponent(Dialog.Trigger)
export const StDialogBackdrop = pandaComponent(
  Dialog.Backdrop,
  {},
  cva({
    base: {
      // Ark's modal backdrop must cover the same containing block as its positioner.
      position: 'absolute',
      zIndex: 9999,
      inset: 0,
      backgroundColor: 'var(--nv-dialog-backdrop-color)',
      opacity: 'var(--nv-dialog-backdrop-opacity)',
    },
  }),
)
export const StDialogPositioner = pandaComponent(
  Dialog.Positioner,
  {},
  cva({
    base: { position: 'absolute', zIndex: 9999, inset: 0 },
  }),
)
export const StDialogContent = pandaComponent(
  'div',
  {},
  cva({
    base: { maxWidth: '30rem', width: '100%' },
  }),
)
export const StDialogContentWrapper = pandaComponent(
  Dialog.Content,
  {},
  cva({
    base: {
      // Keep the focus-trapped content and descendant portal host on one Ark node.
      width: '100%',
      height: '100%',
      position: 'relative',
      '&:not([hidden])': { display: 'grid' },
      placeItems: 'center',
      overflow: 'auto',
      pointerEvents: 'auto',
      outline: 'none',
      '& > *': { minHeight: 'auto' },
      padding: '3',
    },
  }),
)
export const StDialogTitle = pandaComponent(Dialog.Title)
export const StDialogDescription = pandaComponent(Dialog.Description)
export const StDialogCloseTrigger = pandaComponent(Dialog.CloseTrigger)
