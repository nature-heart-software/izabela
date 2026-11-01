/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { props } from './text.shared'
import { fontSizeStyle } from '@/utils/css-in-js'
import { rem } from 'polished'

const { fontFamily, fontSize } = tokens
export const defaultTextStyle = ({ theme }: any) => ({
  color: theme.text.color,
  fontFamily: fontFamily.sans.join(', '),
  ...fontSizeStyle(fontSize['2']),
})

export const StText = styled('div', props)`
  ${(props) => defaultTextStyle(props)}
  ${({ align = '' }) => align && `text-align: ${align};`}
  ${({ as }) =>
    as === 'span' &&
    `
    display: inline-flex;
  `}
  ${({ theme, type }) =>
    [
      type === 'caption' && {
        color: theme.text.captionColor,
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
    ].filter(Boolean)}
  a {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      bottom: ${() => rem(-tokens.spacing[1])};
      left: 0;
      right: 0;
      height: ${() => rem(tokens.spacing[1])};
      background-color: ${({ theme }) => theme.text.linkUnderlineColor};
    }
  }
`
