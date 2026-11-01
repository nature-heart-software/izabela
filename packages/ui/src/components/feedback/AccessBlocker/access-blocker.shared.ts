import { ExtractPropTypes } from 'vue'

export const sizeValues = ['xs', 'sm', 'md'] as const
export type Size = typeof sizeValues[number]

export const props = {
  as: {
    type: String,
    default: 'div',
  },
  allowed: {
    type: Boolean,
    default: false,
  },
  reason: {
    type: String,
    default: '',
  },
}
export type Props = ExtractPropTypes<typeof props>
