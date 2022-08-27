import { ExtractPropTypes, PropType } from 'vue'
import { TippyOptions } from 'vue-tippy'

export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

export const props = {
  tippyOptions: {
    type: Object as PropType<TippyOptions>,
    default: () => ({}),
  },
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
}

export type Props = ExtractPropTypes<typeof props>
