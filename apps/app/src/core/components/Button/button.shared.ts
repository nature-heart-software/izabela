import { PropType, ExtractPropTypes } from "vue"
export type Size = 'xs'|'sm'|'md'|'lg'
export type Type = 'default'|'plain'|'ghost'

export const buttonProps = {
  selected: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String as PropType<Type>,
    default: 'default',
  },
  size: {
    type: String as PropType<Size>,
    default: '2',
  },
  squared: {
    type: Boolean,
    default: false,
  },
}

export type ButtonProps = ExtractPropTypes<typeof buttonProps>
