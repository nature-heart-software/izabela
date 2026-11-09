import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './group.shared'

export const group = cva({
  base: { display: 'flex' },
  variants: {
    direction: {
      row: { flexDirection: 'row' },
      column: { flexDirection: 'column' },
    },
    noWrap: { true: { flexWrap: 'nowrap' }, false: { flexWrap: 'wrap' } },
    grow: {
      true: { '& > *': { flexGrow: 1 } },
      false: { '& > *': { flexGrow: 0 } },
    },
    align: {
      stretch: { alignItems: 'stretch' },
      center: { alignItems: 'center' },
      start: { alignItems: 'start' },
      end: { alignItems: 'end' },
    },
    justify: { left: {}, center: {}, right: {}, apart: {}, around: {} },
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
  compoundVariants: [
    {
      direction: 'row',
      justify: 'left',
      css: { justifyContent: 'flex-start' },
    },
    {
      direction: 'column',
      grow: false,
      justify: 'left',
      css: { alignItems: 'flex-start' },
    },
    { direction: 'row', justify: 'center', css: { justifyContent: 'center' } },
    {
      direction: 'column',
      grow: false,
      justify: 'center',
      css: { alignItems: 'center' },
    },
    { direction: 'row', justify: 'right', css: { justifyContent: 'flex-end' } },
    {
      direction: 'column',
      grow: false,
      justify: 'right',
      css: { alignItems: 'flex-end' },
    },
    {
      direction: 'row',
      justify: 'apart',
      css: { justifyContent: 'space-between' },
    },
    {
      direction: 'column',
      grow: false,
      justify: 'apart',
      css: { alignItems: 'flex-start' },
    },
    {
      direction: 'row',
      justify: 'around',
      css: { justifyContent: 'space-around' },
    },
    {
      direction: 'column',
      grow: false,
      justify: 'around',
      css: { alignItems: 'space-around' },
    },
    { direction: 'column', grow: true, css: { alignItems: 'stretch' } },
  ],
})
export const StGroup = pandaComponent('div', props, ({ justify, ...values }) =>
  group({ ...values, justify: justify === 'between' ? 'apart' : justify }),
)
