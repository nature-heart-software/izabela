import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './card.shared'

export const card = cva({
  base: {
    backgroundColor: 'var(--nv-card-background-color)',
    borderRadius: 'md',
    boxShadow: 'lg',
    fontSize: 0,
  },
  variants: {
    size: {
      xs: { padding: '2' },
      sm: { padding: '3' },
      md: { padding: '5' },
    },
    variant: {
      default: {},
      transparent: {
        backgroundColor:
          'color-mix(in srgb, var(--nv-card-transparent-backdrop-color) calc(var(--nv-card-transparent-backdrop-opacity) * 100%), transparent)',
      },
    },
  },
})
export const StCard = pandaComponent('div', props, card)
