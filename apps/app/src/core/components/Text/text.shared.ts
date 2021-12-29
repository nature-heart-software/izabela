import { ExtractPropTypes } from 'vue'

export const props = {
  size: {
    type: String,
    default: '2',
  },
  as: {
    type: String,
    default: 'div',
  },
}

export type Props = ExtractPropTypes<typeof props>
