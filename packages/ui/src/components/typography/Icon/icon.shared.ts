import tokens from '@/styles/tokens'
import { PropType } from 'vue'

export const props = {
  name: {
    String,
    default: 'times-square',
  },
  size: {
    type: Number as PropType<keyof typeof tokens.spacing>,
    default: 5,
  },
}
