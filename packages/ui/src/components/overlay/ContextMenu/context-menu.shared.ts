import { ExtractPropTypes, PropType } from 'vue'
import { TippyOptions } from 'vue-tippy'

export const props = {
  tippyOptions: {
    type: Object as PropType<TippyOptions>,
    default: () => ({}),
  },
  options: {
    type: Array as PropType<
      (
        | {
            type?: 'option'
            label?: string
            icon?: string
            disabled?: boolean
            onClick?: () => void
          }
        | {
            type: 'divider'
          }
      )[]
    >,
    default: () => [],
  },
}

export type Props = ExtractPropTypes<typeof props>
