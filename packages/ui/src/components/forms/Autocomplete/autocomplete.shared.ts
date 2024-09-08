import { ExtractPropTypes, PropType } from 'vue'
import { tokens } from '@/styles/tokens'
import { ComputePositionConfig } from '@floating-ui/vue'

export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = (typeof sizeValues)[number]
export const defaultWidth = 300 as const

export const props = {
    options: {
        type: Array as PropType<unknown[]>,
        default: () => [],
    },
    size: {
        type: String as PropType<Size>,
        default: 'md',
    },
    estimateSize: {
        type: Number,
        default: tokens.spacing['7'],
    },
    valueKey: {
        type: String,
    },
    placement: {
        type: String as PropType<ComputePositionConfig['placement']>,
        default: 'bottom-start',
    },
    visible: {
        type: Boolean,
        default: false,
    },
    width: {
        type: Number,
    },
    autoScrollIndex: {
        type: Number,
    },
    selectOnTab: {
        type: Boolean,
        default: false,
    },
}
export type Props = ExtractPropTypes<typeof props>
