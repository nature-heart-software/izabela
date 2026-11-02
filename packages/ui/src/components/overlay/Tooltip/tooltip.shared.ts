import { ExtractPropTypes, PropType } from 'vue'
import type { Props as TippyProps } from 'tippy.js'

type TippyOptions = Partial<TippyProps>

export const props = {
  tippyOptions: {
    type: Object as PropType<TippyOptions>,
    default: () => ({}),
  },
}

export type Props = ExtractPropTypes<typeof props>
