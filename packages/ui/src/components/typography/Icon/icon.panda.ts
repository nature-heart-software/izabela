import { cva } from '@/styled-system/css'

export const icon = cva({
  variants: {
    size: {
      1: { width: '{fontSizes.1}', height: '{fontSizes.1}' },
      2: { width: '{fontSizes.2}', height: '{fontSizes.2}' },
      3: { width: '{fontSizes.3}', height: '{fontSizes.3}' },
      4: { width: '{fontSizes.4}', height: '{fontSizes.4}' },
      5: { width: '{fontSizes.5}', height: '{fontSizes.5}' },
      6: { width: '{fontSizes.6}', height: '{fontSizes.6}' },
      7: { width: '{fontSizes.7}', height: '{fontSizes.7}' },
      8: { width: '{fontSizes.8}', height: '{fontSizes.8}' },
      9: { width: '{fontSizes.9}', height: '{fontSizes.9}' },
      10: { width: '{fontSizes.10}', height: '{fontSizes.10}' },
      11: { width: '{fontSizes.11}', height: '{fontSizes.11}' },
      12: { width: '{fontSizes.12}', height: '{fontSizes.12}' },
      13: { width: '{fontSizes.13}', height: '{fontSizes.13}' },
      14: { width: '{fontSizes.14}', height: '{fontSizes.14}' },
      15: { width: '{fontSizes.15}', height: '{fontSizes.15}' },
      16: { width: '{fontSizes.16}', height: '{fontSizes.16}' },
    },
  },
})
