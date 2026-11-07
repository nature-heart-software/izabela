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
      backgroundColor: 'var(--nv-tag-background-color)',
      borderColor: 'var(--nv-tag-border-color)',
      minWidth: '0',
      fontSize: '0.75rem',
      lineHeight: '1.4',
      letterSpacing: '0.02rem',
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
    icon: { display: 'inline-flex', position: 'absolute', right: '2' },
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
