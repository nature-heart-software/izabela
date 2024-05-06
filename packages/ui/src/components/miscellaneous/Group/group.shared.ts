import { ExtractPropTypes, PropType } from 'vue'

import { tokens } from '@/styles/tokens'

export const justifyValues = [
    'left',
    'center',
    'right',
    'apart',
    'around',
] as const
export type Justify = typeof justifyValues[number]
export const alignValues = ['stretch', 'center', 'start', 'end'] as const
export type Align = typeof alignValues[number]
export const directionValues = ['row', 'column'] as const
export type Direction = typeof directionValues[number]

export const props = {
    justify: {
        type: String as PropType<Justify>,
        default: 'left',
    },
    noWrap: { type: Boolean, default: false },
    grow: { type: Boolean, default: false },
    spacing: {
        type: Number as PropType<keyof typeof tokens.spacing>,
        default: 3,
    },
    direction: {
        type: String as PropType<Direction>,
        default: 'row',
    },
    align: {
        type: String as PropType<Align>,
        default: 'center',
    },
    as: {
        type: String,
        default: 'div',
    },
}

export type Props = ExtractPropTypes<typeof props>
