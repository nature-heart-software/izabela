import { cva } from '@/styled-system/css'
import { pandaComponent } from './utils/panda'
import './styles'

export * from './components'
export * from './themes'
export { tokens } from './styles/tokens'
export { NvLoading, loadingDirective } from './loading'
export { PORTAL_TARGET } from './consts'

const globalRecipe = cva({
  base: {
    color: 'text.body.foreground',
    '& *::-webkit-scrollbar': { width: '5' },
    '& *::-webkit-scrollbar-thumb': {
      borderLeft: '0.5rem solid transparent',
      backgroundClip: 'padding-box',
      backgroundColor: 'button.plain.background',
      _hover: {
        backgroundColor: 'button.plain.hover.background',
      },
      _active: {
        backgroundColor: 'button.plain.pressed.background',
      },
    },
    '& #vjt-tooltip': {
      backgroundColor: 'tooltip.default.background',
      color: 'tooltip.default.text',
      boxShadow: 'tooltip.default.shadow',
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
      backgroundColor: 'tooltip.default.background',
      boxShadow: 'tooltip.default.shadow',
    },
    '& .vjt-highlight': {
      outline: '2px solid {colors.button.plain.background}',
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
