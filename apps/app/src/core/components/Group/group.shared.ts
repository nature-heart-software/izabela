import { ExtractPropTypes, PropType } from 'vue'
import type { Properties } from 'csstype'

import tokens from '@/styles/tokens'

export const positionValues = ['left', 'center', 'right', 'apart'] as const
export type Position = typeof positionValues[number]

export const props = {
  position: {
    type: String as PropType<Position>,
    default: 'left',
  },
  noWrap: { type: Boolean, default: false },
  grow: { type: Boolean, default: false },
  spacing: {
    type: Number as PropType<keyof typeof tokens.spacing>,
    default: 3,
  },
  direction: {
    type: String as PropType<'row' | 'column'>,
    default: 'row',
  },
  align: { type: String as PropType<Properties['alignItems']>, default: 'center' },
  as: {
    type: String,
    default: 'div',
  },
}

export type Props = ExtractPropTypes<typeof props>
