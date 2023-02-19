import { ExtractPropTypes, PropType } from 'vue'
import { TippyOptions } from 'vue-tippy'

export const props = {
  tippyOptions: {
    type: Object as PropType<TippyOptions>,
    default: () => ({}),
  },
}

export type Props = ExtractPropTypes<typeof props>
