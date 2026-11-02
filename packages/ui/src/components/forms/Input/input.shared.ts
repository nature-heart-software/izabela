import { ExtractPropTypes, PropType } from 'vue'

export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

export const props = {
  modelValue: {},
  showPassword: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
}
export type Props = ExtractPropTypes<typeof props>
