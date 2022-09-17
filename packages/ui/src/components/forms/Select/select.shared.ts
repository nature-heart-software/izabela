import { ExtractPropTypes, PropType } from 'vue'

export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

export const props = {
  modelValue: {},
  size: {
    type: String as PropType<Size>,
    default: 'md' as const,
  },
}

export type Value = string | number | boolean | object | null | undefined

export const propsV2 = {
  multiple: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [String, Number, Object, Array] as PropType<Value | Value[]>,
  },
  options: {
    type: Array as PropType<unknown[]>,
    default: () => [],
  },
  size: {
    type: String as PropType<Size>,
    default: 'md',
  },
  valueKey: {
    type: String,
    default: '',
  },
  labelKey: {
    type: String,
    default: '',
  },
  isFocused: {
    type: Boolean,
    default: false,
  },
}
export type Props = ExtractPropTypes<typeof props>
export type PropsV2 = ExtractPropTypes<typeof propsV2>
