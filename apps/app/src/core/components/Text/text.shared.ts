import { ExtractPropTypes, PropType } from 'vue'

export type Type = 'caption' | 'body-small' | 'body' | 'subtitle' | 'title'

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
}

export type Props = ExtractPropTypes<typeof props>
