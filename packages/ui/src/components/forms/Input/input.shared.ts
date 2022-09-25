import { ExtractPropTypes, PropType } from 'vue'

export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

export const props = {
  modelValue: {},
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
}
export type Props = ExtractPropTypes<typeof props>
