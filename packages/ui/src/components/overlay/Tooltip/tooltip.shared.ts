import { ExtractPropTypes, PropType } from 'vue'
import type { OverlayOptions } from '../overlay-options'

export const props = {
  tippyOptions: {
    type: Object as PropType<OverlayOptions>,
    default: () => ({}),
  },
}

export type Props = ExtractPropTypes<typeof props>
