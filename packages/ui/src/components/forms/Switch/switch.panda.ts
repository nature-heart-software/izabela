import { sva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './switch.shared'

export const switchRecipe = sva({
  slots: ['root', 'label', 'control', 'thumb'],
  base: {
    root: { display: 'inline-flex', flexShrink: '0' },
    // The label is the hit target; the visually hidden native input owns Space and focus.
    label: {
      display: 'inline-flex',
      position: 'relative',
      cursor: 'pointer',
      '&[data-disabled]': { cursor: 'not-allowed' },
    },
    control: {
      display: 'inline-flex',
      width: '8',
      height: '6',
      padding: '2',
      position: 'relative',
      borderRadius: 'sm',
      outline: '0',
      backgroundColor: 'switch.off.background',
      transition: 'all .3s',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        border: '1px solid {colors.switch.off.border}',
        borderRadius: 'sm',
        pointerEvents: 'none',
        transition: 'all .3s',
      },
      '&[data-hover]': { backgroundColor: 'switch.off.hover.background' },
      '&[data-hover]::after': {
        borderColor: 'switch.off.hover.border',
      },
      '&[data-focus]': {
        backgroundColor: 'switch.off.focus.background',
        boxShadow: '0 0 0 0.25rem {colors.switch.off.focus.focus-ring}',
      },
      '&[data-focus]::after': { borderColor: 'switch.off.focus.border' },
      '&[data-focus][data-hover]': {
        backgroundColor: 'switch.off.hover-focus.background',
      },
      '&[data-state="checked"]': {
        backgroundColor: 'switch.on.background',
        '&::after': { border: '1px solid {colors.switch.on.border}' },
        '&[data-hover]': { backgroundColor: 'switch.on.hover.background' },
        '&[data-hover]::after': { borderColor: 'switch.on.hover.border' },
        '&[data-focus]': {
          backgroundColor: 'switch.on.focus.background',
          boxShadow: '0 0 0 0.25rem {colors.switch.on.focus.focus-ring}',
        },
        '&[data-focus]::after': { borderColor: 'switch.on.focus.border' },
        '&[data-focus][data-hover]': {
          backgroundColor: 'switch.on.hover-focus.background',
        },
      },
    },
    thumb: {
      display: 'inline-flex',
      position: 'relative',
      width: '5',
      height: '5',
      borderRadius: 'xs',
      left: '0',
      backgroundColor: 'switch.off.thumb-background',
      '&[data-hover]': { backgroundColor: 'switch.off.hover.thumb-background' },
      '&[data-focus]': { backgroundColor: 'switch.off.focus.thumb-background' },
      '&[data-focus][data-hover]': {
        backgroundColor: 'switch.off.hover-focus.thumb-background',
      },
      transition: 'all .3s',
      '&[data-state="checked"]': {
        backgroundColor: 'switch.on.thumb-background',
        '&[data-hover]': {
          backgroundColor: 'switch.on.hover.thumb-background',
        },
        '&[data-focus]': {
          backgroundColor: 'switch.on.focus.thumb-background',
        },
        '&[data-focus][data-hover]': {
          backgroundColor: 'switch.on.hover-focus.thumb-background',
        },
        left: '5',
      },
    },
  },
})
export const StSwitch = pandaComponent('span', props, () => switchRecipe().root)
