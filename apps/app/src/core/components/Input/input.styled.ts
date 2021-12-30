/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './input.shared'
import { Props, Size } from './input.shared'
import { CSSObject } from '@/types/css-in-js'

const { fontSize, space, borderRadius, borderWidth, colors, transition } = store.getters.theme
const getStyleFromSize = ({ size }: Props) => {
  const styles: { [key in Size]: CSSObject } = {
    sm: {
      padding: `0 ${space['3']}`,
      height: space['6'],
    },
    md: {
      padding: `0 ${space['5']}`,
      height: space['7'],
    },
    lg: {
      padding: `0 ${space['5']}`,
      height: space['8'],
      fontSize: fontSize['2'][0],
      ...fontSize['2'][1],
    },
  }
  return styles[size]
}
export const StInput = styled('div', props)`
  display: inline-flex;

  & > * {
    width: 100%;
  }

  .el-input {
    line-height: 1;

    .el-input__inner {
      align-items: center;
      font-size: ${fontSize['1'][0]};
      ${fontSize['1'][1]}
      font-weight: 600;
      border-radius: ${borderRadius.DEFAULT};
      border-width: ${borderWidth.DEFAULT};
      outline: 0;
      border-color: ${colors.gray['20']};
      transition: ${transition.DEFAULT};

      &:hover {
        border-color: ${colors.gray['30']};
      }

      &:focus {
        box-shadow: 0 0 0 ${borderWidth.lg} ${colors.gray['10']};
        border-color: ${colors.gray['30']};
      }

      ${getStyleFromSize}
    }
  }
`
