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
export type Option = {
  id?: Exclude<Value, object>
  label: string
  value: Value
  disabled?: boolean
  attr?: Record<string, number | string>
}

export const propsV2 = {
  multiple: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [String, Number, Object, Array] as PropType<Value | Value[]>,
  },
  options: {
    type: Array as PropType<Option[]>,
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
  isFocused: {
    type: Boolean,
    default: false,
  },
}
export type Props = ExtractPropTypes<typeof props>
export type PropsV2 = ExtractPropTypes<typeof propsV2>
