import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './divider.shared'

export const divider = cva({
  base: { borderColor: 'var(--nv-divider-border-color)' },
  variants: {
    direction: {
      vertical: {
        display: 'inline-flex',
        borderRightWidth: 'thin',
        borderRightStyle: 'solid',
      },
      horizontal: { borderTopWidth: 'thin', borderTopStyle: 'solid' },
    },
  },
})
export const StDivider = pandaComponent('div', props, divider)
