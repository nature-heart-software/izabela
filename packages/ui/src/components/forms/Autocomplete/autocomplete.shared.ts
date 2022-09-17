import { ExtractPropTypes, PropType } from 'vue'
import tokens from '@/styles/tokens'

export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

export const props = {
  data: {
    type: Array as PropType<unknown[]>,
    default: () => [],
  },
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
  minItemSize: {
    type: Number,
    default: tokens.spacing['7'],
  },
  valueKey: {
    type: String,
    default: '',
  },
  autoScrollValue: {},
}
export type Props = ExtractPropTypes<typeof props>
