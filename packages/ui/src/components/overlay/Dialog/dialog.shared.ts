import { ExtractPropTypes } from 'vue'
import type { DialogRootProps } from '@ark-ui/vue'

export const props = {
  portalTarget: {
    type: String,
    default: 'body',
  },
}

export type Props = ExtractPropTypes<typeof props> & DialogRootProps
