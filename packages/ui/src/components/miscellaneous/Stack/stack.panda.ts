import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './stack.shared'

export const stack = cva({
  base: { display: 'flex', flexDirection: 'column' },
  variants: {
    justify: {
      left: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      right: { justifyContent: 'flex-end' },
      apart: { justifyContent: 'space-between' },
      around: { justifyContent: 'space-around' },
    },
    align: {
      start: { alignItems: 'flex-start' },
      center: { alignItems: 'center' },
      end: { alignItems: 'flex-end' },
      stretch: { alignItems: 'stretch' },
    },
    spacing: {
      1: { gap: '1' },
      2: { gap: '2' },
      3: { gap: '3' },
      4: { gap: '4' },
      5: { gap: '5' },
      6: { gap: '6' },
      7: { gap: '7' },
      8: { gap: '8' },
      9: { gap: '9' },
      10: { gap: '10' },
      11: { gap: '11' },
      12: { gap: '12' },
      13: { gap: '13' },
      14: { gap: '14' },
      15: { gap: '15' },
      16: { gap: '16' },
    },
  },
})
export const StStack = pandaComponent('div', props, stack)
