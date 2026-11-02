import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './center.shared'

export const center = cva({
  base: { alignItems: 'center', justifyContent: 'center' },
  variants: {
    inline: { true: { display: 'inline-flex' }, false: { display: 'flex' } },
  },
})
export const StCenter = pandaComponent('div', props, center)
