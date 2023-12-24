import { ExtractPropTypes, PropType } from 'vue'

export const sizeValues = ['sm', 'md', 'lg'] as const
export type Size = typeof sizeValues[number]

export const optionProps = {
  active: {
    type: Boolean,
    default: false,
  },
}

export type Value = string | number | boolean | object | null | undefined
export type Option = {
  id?: Exclude<Value, object>
  label: string
  value?: Value
  disabled?: boolean
  readonly?: boolean
  attr?: Record<string, number | string>
  children?: Omit<Option, 'children'>[]
}

export const selectProps = {
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
  autocompleteWidth: {
    type: Number,
  },
}
export type SelectProps = ExtractPropTypes<typeof selectProps>
export type OptionProps = ExtractPropTypes<typeof optionProps>
