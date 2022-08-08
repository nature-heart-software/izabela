import { ExtractPropTypes } from 'vue'

export const props = {
  as: {
    type: String,
    default: 'span',
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
}

export type Props = ExtractPropTypes<typeof props>
