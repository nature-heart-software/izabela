import { cva } from '@/styled-system/css'
import { pandaComponent } from './utils/panda'
import './styles'

export * from './components'
export * from './themes'
export { tokens, tailwindTheme } from './styles/tokens'
export { NvLoading, loadingDirective } from './loading'
export { PORTAL_TARGET } from './consts'

const globalRecipe = cva({
  base: {
    color: 'var(--nv-text-color)',
    '& *::-webkit-scrollbar': { width: '5' },
    '& *::-webkit-scrollbar-thumb': {
      borderLeft: '0.5rem solid transparent',
      backgroundClip: 'padding-box',
      backgroundColor: 'var(--nv-button-plain-background-color)',
      _hover: {
        backgroundColor: 'var(--nv-button-plain-hover-background-color)',
      },
      _active: {
        backgroundColor: 'var(--nv-button-plain-active-background-color)',
      },
    },
    '& #vjt-tooltip': {
      backgroundColor: 'var(--nv-button-plain-background-color)',
      color: 'var(--nv-button-plain-color)',
      boxShadow: 'lg',
      borderRadius: 'md',
      fontSize: 'inherit',
      padding: '5',
      display: 'flex',
      flexDirection: 'column',
      gap: '5',
      '& [type="body"]': { color: 'inherit' },
      '&[data-hidden]': { display: 'none !important' },
    },
    '& #vjt-arrow::before': {
      backgroundColor: 'var(--nv-button-plain-background-color)',
      boxShadow: 'lg',
    },
    '& .vjt-highlight': {
      outline: '2px solid var(--nv-button-plain-background-color)',
      borderRadius: 'inherit',
    },
  },
})

/**
 * Supplies inherited theme colors and shared application presentation.
 * @example
 * ```vue
 * <GlobalStyles><NvButton>Save</NvButton></GlobalStyles>
 * ```
 */
export const GlobalStyles = pandaComponent('div', {}, globalRecipe)
