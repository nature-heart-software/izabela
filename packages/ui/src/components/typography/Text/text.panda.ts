import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { tokens } from '@/styles/tokens'
import { fontSizeStyle } from '@/utils/css-in-js'
import { props } from './text.shared'

/** Default typography for consumers sharing the Text component's visual contract. */
export const defaultTextStyle = ({ theme }: any) => ({
  color: theme?.text?.body?.foreground ?? 'var(--nv-text-body-foreground)',
  fontFamily: tokens.fontFamily.sans,
  ...fontSizeStyle(tokens.fontSize[2]),
})

export const text = cva({
  base: {
    color: 'text.body.foreground',
    fontFamily: 'sans',
    fontSize: '2',
    lineHeight: 'default',
    letterSpacing: 'default',
    '& a': {
      // The underline is positioned relative to its link, not the text container.
      position: 'relative',
    },
    // Text provides a fallback; a composing control owns its link color.
    '& :where(a)::before': {
      content: '""',
      position: 'absolute',
      bottom: 'calc(-1 * {spacing.1})',
      left: 0,
      right: 0,
      height: '1',
      backgroundColor: 'text.body.linkUnderline',
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
        color: 'text.caption.foreground',
        '& :where(a)::before': {
          backgroundColor: 'text.caption.linkUnderline',
        },
        fontSize: '1',
        lineHeight: 'default',
        letterSpacing: 'default',
      },
      label: {
        color: 'text.label.foreground',
        '& :where(a)::before': { backgroundColor: 'text.label.linkUnderline' },
        fontWeight: 700,
      },
      'body-small': {
        color: 'text.body-small.foreground',
        '& :where(a)::before': {
          backgroundColor: 'text.body-small.linkUnderline',
        },
        fontSize: '1',
        lineHeight: 'default',
        letterSpacing: 'default',
      },
      body: {
        color: 'text.body.foreground',
        '& :where(a)::before': { backgroundColor: 'text.body.linkUnderline' },
      },
      subtitle: {
        color: 'text.subtitle.foreground',
        '& :where(a)::before': {
          backgroundColor: 'text.subtitle.linkUnderline',
        },
        fontWeight: 700,
      },
      title: {
        color: 'text.title.foreground',
        '& :where(a)::before': { backgroundColor: 'text.title.linkUnderline' },
        fontSize: '4',
        lineHeight: 'default',
        letterSpacing: 'default',
        fontWeight: 700,
      },
    },
  },
})
export const StText = pandaComponent('div', props, (props) =>
  text({ ...props, inline: props.as === 'span' }),
)
