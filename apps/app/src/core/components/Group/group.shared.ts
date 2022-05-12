import { ExtractPropTypes, PropType } from 'vue'
import type { Properties } from 'csstype'

import theme from '@/styles/tokens'

export type GroupPosition = 'right' | 'center' | 'left' | 'apart'
export const props = {
  position: {
    type: String as PropType<GroupPosition>,
    default: 'left',
  },
  noWrap: { type: Boolean, default: false },
  grow: { type: Boolean, default: false },
  spacing: {
    type: String as PropType<keyof typeof theme.spacing>,
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
