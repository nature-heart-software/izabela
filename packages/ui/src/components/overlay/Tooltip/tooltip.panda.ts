import { Tooltip } from '@ark-ui/vue'
import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './tooltip.shared'

export const StTooltip = pandaComponent('div', props, cva({ base: {} }))
export const tooltipPositioner = cva({
  base: {
    zIndex: '9999 !important',
    animationName: 'nv-tooltip-in',
    animationDuration: 'var(--nv-tooltip-enter-duration, 300ms)',
    animationTimingFunction: 'ease',
    animationFillMode: 'both',
  },
})
export const StTooltipPositioner = pandaComponent(
  Tooltip.Positioner,
  {},
  // Override Ark's inline positioning z-index without adding a tooltip click shield.
  tooltipPositioner,
)
export const StTooltipContent = pandaComponent(
  Tooltip.Content,
  {},
  cva({
    base: {
      // The passive surface stays with Ark's described-by target, not a click shield.
      maxWidth: '18.75rem',
      pointerEvents: 'none',
      boxShadow: 'tooltip.default.shadow',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'tooltip.default.border',
      color: 'tooltip.default.text',
      backgroundColor: 'tooltip.default.background',
      paddingBlock: '1',
      paddingInline: '2',
      borderRadius: 'xs',
      '& *': { color: 'inherit' },
      '& svg': { color: 'tooltip.default.icon' },
    },
  }),
)
