import { ExtractPropTypes, PropType } from 'vue'

export const typeValues = ['success', 'warning', 'info', 'error'] as const
export type Type = typeof typeValues[number]

export const props = {
  type: {
    type: String as PropType<Type>,
    default: 'info',
  },
  as: {
    type: String,
    default: 'div',
  },
  size: {
    type: String,
    default: 'sm',
  },
}

export type Props = ExtractPropTypes<typeof props>
