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
      borderColor: 'contextMenu.default.border',
      backgroundColor: 'contextMenu.default.background',
      borderRadius: 'md',
      boxShadow: 'contextMenu.default.shadow',
      '& [data-part="item"]': {
        color: 'contextMenu.item.text',
        '& svg': { color: 'contextMenu.item.icon' },
      },
      '& [data-part="item"][data-disabled]': {
        color: 'contextMenu.item.disabled.text',
        '& svg': { color: 'contextMenu.item.disabled.icon' },
      },
      '& [data-part="separator"]': {
        borderColor: 'contextMenu.divider.border',
      },
      '& [data-highlighted]': {
        color: 'contextMenu.item.hover.text',
        '& svg': { color: 'contextMenu.item.hover.icon' },
        backgroundColor: 'contextMenu.item.hover.background',
      },
    },
  }),
)

export const contextMenuShield = cva({
  base: {
    // The hit-test surface must cover the viewport, including inside dialogs.
    position: 'fixed',
    inset: 0,
    pointerEvents: 'auto',
    zIndex: 9999,
  },
})
