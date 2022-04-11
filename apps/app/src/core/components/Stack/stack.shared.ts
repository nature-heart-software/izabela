import { ExtractPropTypes, PropType } from 'vue'

const theme = require('@/theme')

export type StackPosition = 'right' | 'center' | 'left' | 'apart'
export const props = {
  spacing: {
    type: Number as PropType<keyof typeof theme.spacing>,
    default: 3,
  },
  align: { type: String as PropType<'stretch' | 'center' | 'start' | 'end'>, default: 'stretch' },
  justify: {
    type: String as PropType<'start' | 'center' | 'end' | 'between' | 'around'>,
    default: 'center',
  },
  as: {
    type: String,
    default: 'div',
  },
}

export type Props = ExtractPropTypes<typeof props>
