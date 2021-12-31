import { ExtractPropTypes, PropType } from 'vue'

export type Size = 'sm' | 'md' | 'lg'

export const props = {
  modelValue: {},
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
}
export type Props = ExtractPropTypes<typeof props>
