import { ExtractPropTypes } from 'vue'

export const props = {
  inline: {
    type: Boolean,
    default: false,
  },
  as: {
    type: String,
    default: 'div',
  },
}

export type Props = ExtractPropTypes<typeof props>
