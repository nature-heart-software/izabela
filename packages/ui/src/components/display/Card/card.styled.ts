/* eslint-disable */
import styled from 'vue3-styled-components'
import { tokens } from '@/styles/tokens'
import { props, Props, Size } from './card.shared'
import { CSSObject } from '@/types/css-in-js'
import { rem } from 'polished'

const { colors, spacing, borderRadius, boxShadow } = tokens
const styleBySize = ({ size }: Props) => {
    const styles: Record<Size, CSSObject> = {
        xs: {
            padding: `${ rem(spacing['2']) }`,
        },
        sm: {
            padding: `${ rem(spacing['3']) }`,
        },
        md: {
            padding: `${ rem(spacing['5']) }`,
        },
    }
    return styles[size]
}
export const StCard = styled('div', props)`
  background-color: ${ () => colors.white };
  padding: ${ () => rem(spacing['3']) };
  border-radius: ${ () => rem(borderRadius.DEFAULT) };
  box-shadow: ${ () => boxShadow.DEFAULT };
  font-size: 0;
  //overflow: hidden;
  ${ styleBySize }
`
