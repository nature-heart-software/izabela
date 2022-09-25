import { PropType } from 'vue'

export const directionValues = ['vertical', 'horizontal'] as const
export type Direction = typeof directionValues[number]

export const props = {
  direction: {
    type: String as PropType<Direction>,
    default: 'vertical',
  },
}
