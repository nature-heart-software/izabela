import { Menu } from '@ark-ui/vue'
import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './context-menu.shared'

export const StContextMenu = pandaComponent('div', props, cva({ base: {} }))

export const contextMenuPositioner = cva({
  base: { zIndex: '9999 !important' },
})
export const StContextMenuContent = pandaComponent(
  Menu.Content,
  {},
  cva({
    base: {
      // Ark owns the menu surface; sizing must stay on its focusable element.
      minWidth: '9.375rem',
      maxWidth: '18.75rem',
      outline: 'none',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--nv-context-menu-border-color)',
      backgroundColor: 'var(--nv-context-menu-background-color)',
      borderRadius: 'md',
      boxShadow: 'lg',
      '& [data-highlighted]': {
        backgroundColor: 'var(--nv-select-option-hover-background-color)',
      },
    },
  }),
)

export const contextMenuShield = cva({
  base: {
    // The hit-test surface must cover the viewport, including inside dialogs.
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    transform: 'translate(var(--nv-shield-x, 0px), var(--nv-shield-y, 0px))',
    pointerEvents: 'auto',
    zIndex: 9999,
  },
})
