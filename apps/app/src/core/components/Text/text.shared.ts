import { ExtractPropTypes, PropType } from 'vue'

export const typeValues = ['caption', 'label', 'body-small', 'body', 'subtitle', 'title']
export type Type = typeof typeValues[number]
export const alignValues = ['stretch', 'center', 'start', 'end']
export type Align = typeof alignValues[number]

export const props = {
  size: {
    type: String,
    default: '2',
  },
  as: {
    type: String,
    default: 'div',
  },
  type: {
    type: String as PropType<Type>,
    default: 'body',
  },
  align: {
    type: String as PropType<Align>,
    default: '',
  },
}

export type Props = ExtractPropTypes<typeof props>
