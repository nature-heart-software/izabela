import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './alert.shared'

export const alert = cva({
  base: {
    borderRadius: 'sm',
    '& > *': { color: 'inherit' },
  },
  variants: {
    type: {
      info: {
        backgroundColor: 'var(--nv-alert-info-background-color)',
        color: 'var(--nv-alert-info-color)',
      },
      success: {
        backgroundColor: 'var(--nv-alert-success-background-color)',
        color: 'var(--nv-alert-success-color)',
      },
      warning: {
        backgroundColor: 'var(--nv-alert-warning-background-color)',
        color: 'var(--nv-alert-warning-color)',
      },
      error: {
        backgroundColor: 'var(--nv-alert-error-background-color)',
        color: 'var(--nv-alert-error-color)',
      },
    },
    size: {
      xs: { padding: '2', minHeight: '{spacing.5}' },
      sm: { padding: '3', minHeight: '{spacing.6}' },
      md: { padding: '5', minHeight: '{spacing.7}' },
      lg: { padding: '5', minHeight: '{spacing.8}' },
    },
  },
})
export const StAlert = pandaComponent('div', props, alert)
