import { ExtractPropTypes, PropType } from 'vue'
import type { Properties } from 'csstype'

export type Type = 'caption' | 'label' | 'body-small' | 'body' | 'subtitle' | 'title'

export const props = {
  size: {
    type: String,
    default: '2',
  },
  as: {
    type: String,
    default: 'div',
  },
  type: {
    type: String as PropType<Type>,
    default: 'body',
  },
  align: {
    type: String as PropType<Properties['textAlign']>,
    default: '',
  },
}

export type Props = ExtractPropTypes<typeof props>
