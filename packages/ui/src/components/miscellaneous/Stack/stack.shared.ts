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
export const alignValues = ['start', 'center', 'end', 'stretch'] as const
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
        default: 'left',
    },
    as: {
        type: String,
        default: 'div',
    },
}

export type Props = ExtractPropTypes<typeof props>
