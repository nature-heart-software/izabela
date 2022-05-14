import { PropType } from 'vue'

type Direction = 'vertical' | 'horizontal'
export const props = {
  direction: {
    type: String as PropType<Direction>,
    default: 'vertical',
  },
}
