import { ExtractPropTypes, PropType } from 'vue'
import { Properties } from 'csstype'
import { tokens } from '@/styles/tokens'

export const typeValues = [
    'caption',
    'label',
    'body-small',
    'body',
    'subtitle',
    'title',
] as const
export type Type = typeof typeValues[number]

export const props = {
    size: {
        type: Number as PropType<keyof typeof tokens.fontSize>,
        default: 2,
    },
    as: {
        type: String,
        default: 'div',
    },
    type: {
        type: String as PropType<Type>,
        default: 'body',
    },
    align: {
        type: String as PropType<Properties['textAlign']>,
        default: '',
    },
}

export type Props = ExtractPropTypes<typeof props>
