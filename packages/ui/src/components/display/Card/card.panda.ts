import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './card.shared'

export const card = cva({
  base: {
    backgroundColor: 'card.default.background',
    borderRadius: 'md',
    boxShadow: 'card.default.shadow',
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
        backgroundColor: 'card.transparent.background',
        boxShadow: 'card.transparent.shadow',
      },
    },
  },
})
export const StCard = pandaComponent('div', props, card)
