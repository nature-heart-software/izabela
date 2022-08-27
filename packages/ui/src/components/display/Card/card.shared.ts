import { ExtractPropTypes, PropType } from 'vue'

export const sizeValues = ['xs', 'sm', 'md'] as const
export type Size = typeof sizeValues[number]

export const props = {
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
}
export type Props = ExtractPropTypes<typeof props>
