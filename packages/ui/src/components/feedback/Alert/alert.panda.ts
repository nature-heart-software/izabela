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
        backgroundColor: 'alert.info.background',
        color: 'alert.info.foreground',
        '& a::before': { backgroundColor: 'alert.info.linkUnderline' },
      },
      success: {
        backgroundColor: 'alert.success.background',
        color: 'alert.success.foreground',
        '& a::before': { backgroundColor: 'alert.success.linkUnderline' },
      },
      warning: {
        backgroundColor: 'alert.warning.background',
        color: 'alert.warning.foreground',
        '& a::before': { backgroundColor: 'alert.warning.linkUnderline' },
      },
      error: {
        backgroundColor: 'alert.error.background',
        color: 'alert.error.foreground',
        '& a::before': { backgroundColor: 'alert.error.linkUnderline' },
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
