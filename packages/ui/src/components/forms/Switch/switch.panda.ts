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
      backgroundColor: 'var(--nv-switch-background-color)',
      transition: 'all .3s',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        border: '1px solid var(--nv-switch-border-color)',
        borderRadius: 'sm',
        pointerEvents: 'none',
        transition: 'all .3s',
      },
      '&[data-hover]::after': {
        borderColor: 'var(--nv-switch-hover-border-color)',
      },
      '&[data-focus]': {
        boxShadow: '0 0 0 0.25rem var(--nv-switch-focus-box-shadow)',
      },
      '&[data-focus]::after': {
        borderColor: 'var(--nv-switch-focus-border-color)',
      },
    },
    thumb: {
      display: 'inline-flex',
      position: 'relative',
      width: '5',
      height: '5',
      borderRadius: 'xs',
      left: '0',
      backgroundColor: 'var(--nv-switch-thumb-color)',
      transition: 'all .3s',
      '&[data-state="checked"]': {
        backgroundColor: 'var(--nv-switch-active-thumb-color)',
        left: '5',
      },
    },
  },
})
export const StSwitch = pandaComponent('span', props, () => switchRecipe().root)
