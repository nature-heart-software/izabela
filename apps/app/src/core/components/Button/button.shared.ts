import { PropType, ExtractPropTypes } from 'vue'

export type Size = 'xs' | 'sm' | 'md' | 'lg'
export type Type = 'default' | 'plain' | 'ghost' | 'ghost-alt'

export const props = {
  selected: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String as PropType<Type>,
    default: 'default',
  },
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
  squared: {
    type: Boolean,
    default: false,
  },
  iconName: {
    type: String,
    default: '',
  },
}

export type Props = ExtractPropTypes<typeof props>
