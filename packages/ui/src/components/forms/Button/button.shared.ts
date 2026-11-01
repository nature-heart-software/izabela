import { ExtractPropTypes, PropType } from 'vue'
import type { Properties } from 'csstype'
import { sizeValues as defaultSizeValues } from '@/utils/css-in-js'

export const sizeValues = ['xs', ...defaultSizeValues] as const
export type Size = (typeof sizeValues)[number]
export const typeValues = [
  'default',
  'plain',
  'ghost',
  'ghost-alt',
  'active',
] as const
export type Type = (typeof typeValues)[number]

export const props = {
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
    default: 'md',
  },
  squared: {
    type: Boolean,
    default: false,
  },
  iconName: {
    type: String,
    default: '',
  },
  align: {
    type: String as PropType<Properties['textAlign']>,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
}

export type Props = ExtractPropTypes<typeof props>
