import { ExtractPropTypes } from 'vue'

export const props = {
  closable: {
    type: Boolean,
    default: false,
  },
}

export type Props = ExtractPropTypes<typeof props>
