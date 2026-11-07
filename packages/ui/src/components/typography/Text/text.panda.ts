import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { tokens } from '@/styles/tokens'
import { fontSizeStyle } from '@/utils/css-in-js'
import { props } from './text.shared'

/** Default typography for consumers sharing the Text component's visual contract. */
export const defaultTextStyle = ({ theme }: any) => ({
  color: theme?.text.color ?? 'var(--nv-text-color)',
  fontFamily: tokens.fontFamily.sans.join(', '),
  ...fontSizeStyle(tokens.fontSize[2]),
})

export const text = cva({
  base: {
    color: 'var(--nv-text-color)',
    fontFamily: 'sans',
    fontSize: '2',
    lineHeight: '2',
    letterSpacing: '2',
    '& a': {
      // The underline is positioned relative to its link, not the text container.
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        bottom: 'calc(-1 * {spacing.1})',
        left: 0,
        right: 0,
        height: '1',
        backgroundColor: 'var(--nv-text-link-underline-color)',
      },
    },
  },
  variants: {
    inline: { true: { display: 'inline-flex' }, false: {} },
    align: {
      left: { textAlign: 'left' },
      center: { textAlign: 'center' },
      right: { textAlign: 'right' },
      start: { textAlign: 'start' },
      end: { textAlign: 'end' },
      justify: { textAlign: 'justify' },
      'match-parent': { textAlign: 'match-parent' },
    },
    type: {
      caption: {
        color: 'var(--nv-text-caption-color)',
        fontSize: '1',
        lineHeight: '1',
        letterSpacing: '1',
      },
      label: { fontWeight: 700 },
      'body-small': { fontSize: '1', lineHeight: '1', letterSpacing: '1' },
      body: {},
      subtitle: { fontWeight: 700 },
      title: {
        fontSize: '4',
        lineHeight: '4',
        letterSpacing: '4',
        fontWeight: 700,
      },
    },
  },
})
export const StText = pandaComponent('div', props, (props) =>
  text({ ...props, inline: props.as === 'span' }),
)
