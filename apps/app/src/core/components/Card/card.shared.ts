import { ExtractPropTypes, PropType } from 'vue'

export type Size = 'xs' | 'sm' | 'md'

export const props = {
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
}
export type Props = ExtractPropTypes<typeof props>
