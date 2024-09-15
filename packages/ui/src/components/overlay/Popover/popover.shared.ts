import { ExtractPropTypes, PropType } from 'vue'
import { ComputePositionConfig } from '@floating-ui/vue'

export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

export const props = {
    placement: {
        type: String as PropType<ComputePositionConfig['placement']>,
        default: 'bottom-end',
    },
    size: {
        type: String as PropType<Size>,
        default: 'md',
    },
}

export type Props = ExtractPropTypes<typeof props>
