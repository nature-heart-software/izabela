/* eslint-disable */
import styled from 'vue3-styled-components'
import store from '@/store'
import { props } from './text.shared'

const { fontFamily, fontSize, colors } = store.getters.theme
export const defaultTextStyle = `
  color: inherit;
  font-family: ${ fontFamily.sans.join(', ') };
  font-size: ${ fontSize['2'][0] };
  line-height: ${ fontSize['2'][1].lineHeight };
  letter-spacing: ${ fontSize['2'][1].letterSpacing };
`
export const StText = styled('div', props)`
  color: inherit;
  font-family: ${ fontFamily.sans.join(', ') };
  font-size: ${ ({ size }) => fontSize[size][0] };
  line-height: ${ ({ size }) => fontSize[size][1].lineHeight };
  letter-spacing: ${ ({ size }) => fontSize[size][1].letterSpacing };
  ${ ({ as }) =>
    as === 'span' &&
    `
    display: inline-flex;
  ` }
  ${ ({ type }) =>
    [
      type === 'caption' &&
      `
      color: ${ colors.gray['60'] };
      font-size: ${ fontSize['1'][0] };
      line-height: ${ fontSize['1'][1].lineHeight };
      letter-spacing: ${ fontSize['1'][1].letterSpacing };
    `,
      type === 'label' &&
      `
      font-weight: 700;
    `,
      type === 'body-small' &&
      `
      font-size: ${ fontSize['1'][0] };
      line-height: ${ fontSize['1'][1].lineHeight };
      letter-spacing: ${ fontSize['1'][1].letterSpacing };
    `,
      type === 'body-small' &&
      `
      font-size: ${ fontSize['1'][0] };
      line-height: ${ fontSize['1'][1].lineHeight };
      letter-spacing: ${ fontSize['1'][1].letterSpacing };
    `,
      type === 'subtitle' &&
      `
      font-size: ${ fontSize['2'][0] };
      line-height: ${ fontSize['2'][1].lineHeight };
      letter-spacing: ${ fontSize['2'][1].letterSpacing };
      font-weight: 700;
    `,
      type === 'title' &&
      `
      font-size: ${ fontSize['4'][0] };
      line-height: ${ fontSize['4'][1].lineHeight };
      letter-spacing: ${ fontSize['4'][1].letterSpacing };
      font-weight: 700;
    `,
    ].filter(Boolean) }
`
