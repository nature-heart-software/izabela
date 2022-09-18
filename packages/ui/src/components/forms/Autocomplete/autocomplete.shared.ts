import { ExtractPropTypes, PropType } from 'vue'
import tokens from '@/styles/tokens'
import { ComputePositionConfig } from '@floating-ui/dom'

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
  placement: {
    type: String as PropType<ComputePositionConfig['placement']>,
    value: 'bottom-start',
  },
  visible: {
    type: Boolean,
    default: false,
  },
  width: {
    type: Number,
  },
  autoScrollValue: {},
}
export type Props = ExtractPropTypes<typeof props>
