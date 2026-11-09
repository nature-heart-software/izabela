import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './divider.shared'

export const divider = cva({
  base: {},
  variants: {
    direction: {
      vertical: {
        borderColor: 'divider.vertical.border',
        display: 'inline-flex',
        borderRightWidth: 'default',
        borderRightStyle: 'solid',
      },
      horizontal: {
        borderColor: 'divider.horizontal.border',
        borderTopWidth: 'default',
        borderTopStyle: 'solid',
      },
    },
  },
})
export const StDivider = pandaComponent('div', props, divider)
