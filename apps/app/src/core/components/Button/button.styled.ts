import styled from 'vue3-styled-components'
import store from '@/store'
import { buttonProps } from './consts'

type Size = 'xs' | 'sm' | 'md' | 'lg' | string

const theme = store.getters['theme']

const getStyleFromSize = (size: Size) => {
  const styles: { [key in Size]: { [key: string]: string } } = {
    xs: {
      padding: `0 ${theme.space['2']}`,
      height: theme.space['5'],
      borderRadius: theme.borderRadius.xs,
      fontSize: theme.fontSize['1'],
    },
    sm: {
      padding: `0 ${theme.space['3']}`,
      height: theme.space['6'],
      borderRadius: theme.borderRadius.sm,
      fontSize: theme.fontSize['1'],
    },
    md: {
      padding: `0 ${theme.space['5']}`,
      height: theme.space['7'],
      borderRadius: theme.borderRadius.DEFAULT,
      fontSize: theme.fontSize['1'],
    },
    lg: {
      padding: `0 ${theme.space['5']}`,
      height: theme.space['8'],
      borderRadius: theme.borderRadius.DEFAULT,
      fontSize: theme.fontSize['1'],
    },
  }
  return styles[size] || styles['md']
}

export const StButton = styled('button', buttonProps)`
  display: inline-flex;
  align-items: center;
  border-width: ${theme.borderWidth.DEFAULT};
  border-color: ${theme.colors.gray['10']};
  ${({ size }) => getStyleFromSize(size)}
  ${({ squared }) =>
    squared &&
    `
        padding: 0;
    `}
`
