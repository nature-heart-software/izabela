import { ExtractPropTypes } from 'vue'

export const props = {
  as: {
    type: String,
    default: 'span',
  },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  modelValue: {
    type: Boolean,
    default: false,
  },
}

export type Props = ExtractPropTypes<typeof props>
