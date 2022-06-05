import { ExtractPropTypes, PropType } from 'vue'
import tokens from '@/styles/tokens'

export const justifyValues = ['left', 'center', 'right', 'apart'] as const
export type Justify = typeof justifyValues[number]
export const alignValues = ['stretch', 'center', 'start', 'end'] as const
export type Align = typeof alignValues[number]

export const props = {
  spacing: {
    type: Number as PropType<keyof typeof tokens.spacing>,
    default: 3,
  },
  align: {
    type: String as PropType<Align>,
    default: 'stretch',
  },
  justify: {
    type: String as PropType<Justify>,
    default: 'center',
  },
  as: {
    type: String,
    default: 'div',
  },
}

export type Props = ExtractPropTypes<typeof props>
