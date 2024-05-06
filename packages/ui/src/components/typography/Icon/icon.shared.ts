import { tokens } from '@/styles/tokens'
import { ExtractPropTypes, PropType } from 'vue'

export const props = {
    name: {
        String,
        default: 'times-square',
    },
    size: {
        type: Number as PropType<keyof typeof tokens.spacing>,
        default: 5,
    },
}

export type Props = ExtractPropTypes<typeof props>
