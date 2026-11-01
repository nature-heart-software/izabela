import { ExtractPropTypes } from 'vue'

export const props = {
    as: {
        type: String,
        default: 'input',
    },
    modelValue: {
        type: Number,
        default: 0,
    },
}

export type Props = ExtractPropTypes<typeof props>
