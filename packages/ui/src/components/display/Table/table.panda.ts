import { cva } from '@/styled-system/css'

// Native table geometry keeps headers associated with their cells without a grid role.
export const table = cva({
  base: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'separate',
    borderSpacing: 0,
    color: 'var(--nv-table-color, var(--nv-text-color))',
    backgroundColor:
      'var(--nv-table-background-color, var(--nv-card-background-color))',
    fontFamily: 'sans',
    fontSize: '2',
    lineHeight: '2',
    '& th, & td': {
      padding: '4',
      borderBottom:
        '{borderWidths.thin} solid var(--nv-table-border-color, var(--nv-divider-border-color))',
      overflowWrap: 'break-word',
    },
    '& th': { fontWeight: 700 },
  },
})
export const tableCell = cva({
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
        backgroundColor: 'inherit',
      },
      right: {
        position: 'sticky',
        right: 0,
        zIndex: 1,
        backgroundColor: 'inherit',
      },
    },
  },
})
