import { ExtractPropTypes, PropType } from 'vue'
import { DialogRootProps } from '@ark-ui/vue'
import { ComputePositionConfig } from '@floating-ui/vue'

export const props = {
    portalTarget: {
        type: String,
        default: 'body',
    },
}

export type Props = ExtractPropTypes<typeof props> & DialogRootProps
