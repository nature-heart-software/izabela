import { sva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './tag.shared'

export const tagRecipe = sva({
  slots: ['root', 'content', 'icon'],
  base: {
    root: {
      position: 'relative',
      display: 'inline-flex',
      height: '6',
      alignItems: 'center',
      fontWeight: '600',
      borderWidth: '1px',
      borderStyle: 'solid',
      outline: '0',
      transition: 'all .3s',
      backgroundColor: 'tag.default.background',
      borderColor: 'tag.default.border',
      minWidth: '0',
      fontSize: '0.75rem',
      lineHeight: 'default',
      letterSpacing: 'default',
      borderRadius: 'sm',
    },
    content: {
      position: 'relative',
      margin: '-1px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: '0',
      paddingX: '3',
    },
    icon: {
      '& button': {
        color: 'tag.close.icon',
        backgroundColor: 'tag.close.background',
        borderColor: 'tag.close.border',
        '&:hover': {
          color: 'tag.close.hover.icon',
          backgroundColor: 'tag.close.hover.background',
          borderColor: 'tag.close.hover.border',
        },
        '&:active': {
          color: 'tag.close.pressed.icon',
          backgroundColor: 'tag.close.pressed.background',
          borderColor: 'tag.close.pressed.border',
        },
        '&:focus': {
          color: 'tag.close.focus.icon',
          backgroundColor: 'tag.close.focus.background',
          borderColor: 'tag.close.focus.border',
          boxShadow: '0 0 0 0.25rem {colors.tag.close.focus.focus-ring}',
        },
      },
      display: 'inline-flex',
      position: 'absolute',
      right: '2',
    },
  },
  variants: { closable: { true: { content: { paddingRight: '6' } } } },
})
export const StTag = pandaComponent(
  'span',
  props,
  (props) => tagRecipe(props).root || '',
)
export const StTagContentWrapper = pandaComponent(
  'span',
  props,
  (props) => tagRecipe(props).content || '',
)
export const StTagIcon = pandaComponent(
  'span',
  props,
  (props) => tagRecipe(props).icon || '',
)
