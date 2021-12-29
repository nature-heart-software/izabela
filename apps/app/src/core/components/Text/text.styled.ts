import styled from 'vue3-styled-components'
import store from '@/store'
import { textProps } from './text.shared'

const theme = store.getters['theme']

export const StText = styled('div', textProps)`
  color: inherit;
  font-family: ${ theme.fontFamily.sans.join(', ') };
  font-size: ${ ({size}) => theme.fontSize[size][0] };
  line-height: ${ ({size}) => theme.fontSize[size][1].lineHeight };
  letter-spacing: ${ ({size}) => theme.fontSize[size][1].letterSpacing };
  ${ ({as}) => as === 'span' ? `
    display: inline-flex;
  ` : ''
  }
`
