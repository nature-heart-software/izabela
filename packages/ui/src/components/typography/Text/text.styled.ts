/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { props } from './text.shared'
import { fontSizeStyle } from '@/utils/css-in-js'
import { rem } from 'polished'

const { fontFamily, fontSize, colors } = tokens
export const defaultTextStyle = () => ({
    color: 'inherit',
    fontFamily: fontFamily.sans.join(', '),
    ...fontSizeStyle(fontSize['2']),
})

export const StText = styled('div', props)`
  ${ () => defaultTextStyle() }
  ${ ({ align = '' }) => align && `text-align: ${ align };` }
  ${ ({ as }) =>
    as === 'span' &&
    `
    display: inline-flex;
  ` }
  ${ ({ type }) =>
    [
        type === 'caption' && {
            color: colors.gray['60'],
            ...fontSizeStyle(fontSize['1']),
        },
        type === 'label' && {
            fontWeight: 700,
        },
        type === 'body-small' && {
            ...fontSizeStyle(fontSize['1']),
        },
        type === 'subtitle' && {
            ...fontSizeStyle(fontSize['2']),
            fontWeight: 700,
        },
        type === 'title' && {
            ...fontSizeStyle(fontSize['4']),
            fontWeight: 700,
        },
    ].filter(Boolean) }
  a {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      bottom: ${ () => rem(-tokens.spacing[1]) };
      left: 0;
      right: 0;
      height: ${ () => rem(tokens.spacing[1]) };
      background-color: ${ () => tokens.colors.gray[80] };
    }
  }
`
