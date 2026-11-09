import { cva } from '@/styled-system/css'

export const formItem = cva({
  base: { '& label': { color: 'form-item.default.text' } },
})
