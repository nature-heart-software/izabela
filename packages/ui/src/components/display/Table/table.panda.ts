import { cva } from '@/styled-system/css'

// Native table geometry keeps headers associated with their cells without a grid role.
export const table = cva({
  base: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'separate',
    borderSpacing: 0,
    color: 'table.default.foreground',
    backgroundColor: 'table.default.background',
    fontFamily: 'sans',
    fontSize: '2',
    lineHeight: 'default',
    '& th, & td': {
      padding: '4',
      borderBottomWidth: 'default',
      borderBottomStyle: 'solid',
      overflowWrap: 'break-word',
    },
    // Generic cells fall back to the table role; columns own their border color.
    '& :where(th, td)': { borderColor: 'table.default.border' },
    '& tbody tr': { backgroundColor: 'table.default.rowBackground' },
    '& th': {
      fontWeight: 700,
      backgroundColor: 'table.default.headerBackground',
      color: 'table.default.headerForeground',
    },
    '& [data-empty]': {
      backgroundColor: 'table.empty.background',
      color: 'table.empty.foreground',
      borderColor: 'table.empty.border',
    },
  },
})
export const tableCell = cva({
  base: {
    backgroundColor: 'tableColumn.default.background',
    color: 'tableColumn.default.foreground',
    '&:is(th, td)': { borderColor: 'tableColumn.default.border' },
    '&:is(th)': {
      backgroundColor: 'tableColumn.default.headerBackground',
      color: 'tableColumn.default.headerForeground',
    },
  },
  variants: {
    align: {
      left: { textAlign: 'left' },
      center: { textAlign: 'center' },
      right: { textAlign: 'right' },
    },
    fixed: {
      // Sticky cells must own their position to preserve native table semantics.
      left: {
        position: 'sticky',
        left: 0,
        zIndex: 1,
        backgroundColor: 'table.frozen.background',
        color: 'table.frozen.foreground',
        '&:is(th, td)': { borderColor: 'table.frozen.border' },
        boxShadow: 'table.frozen.shadow',
      },
      right: {
        position: 'sticky',
        right: 0,
        zIndex: 1,
        backgroundColor: 'table.frozen.background',
        color: 'table.frozen.foreground',
        '&:is(th, td)': { borderColor: 'table.frozen.border' },
        boxShadow: 'table.frozen.shadow',
      },
    },
  },
})
