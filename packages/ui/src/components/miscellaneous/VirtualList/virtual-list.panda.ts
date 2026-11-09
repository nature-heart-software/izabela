import { cva } from '@/styled-system/css'

// Virtual items must share a positioned canvas; measurement remains runtime-owned.
export const virtualList = cva({ base: { position: 'relative' } })
export const virtualListItem = cva({
  base: { position: 'absolute', top: 0, left: 0, width: '100%' },
})
