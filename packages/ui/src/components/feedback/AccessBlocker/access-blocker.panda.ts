import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './access-blocker.shared'

// The reason must cover the protected content without changing its layout.
export const accessBlocker = cva({
  base: { position: 'relative' },
  variants: { allowed: { false: { overflow: 'hidden' }, true: {} } },
})
export const accessBlockerReason = cva({
  base: {
    position: 'absolute',
    inset: 0,
    zIndex: 3000,
    backgroundColor: 'accessBlocker.default.denied.background',
  },
})
export const StAccessBlocker = pandaComponent('div', props, accessBlocker)
export const StAccessBlockerReason = pandaComponent(
  'div',
  {},
  accessBlockerReason,
)

export const accessBlockerCenter = cva({
  base: { width: '100%', height: '100%' },
})
