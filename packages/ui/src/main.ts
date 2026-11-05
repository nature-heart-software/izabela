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
    },
    '& *::-webkit-scrollbar-thumb:hover': {
      backgroundColor: 'button.plain.hover.background',
    },
    '& *::-webkit-scrollbar-thumb:active': {
      backgroundColor: 'button.plain.pressed.background',
    },
    '& #vjt-tooltip': {
      backgroundColor: 'tourGuide.default.background',
      color: 'tourGuide.default.text',
      boxShadow: 'tourGuide.default.shadow',
      borderRadius: 'md',
      fontSize: 'inherit',
      padding: '5',
      display: 'flex',
      flexDirection: 'column',
      gap: '5',
      '& [data-nv-tour-content]': { color: 'inherit' },
      '&[data-hidden]': { display: 'none !important' },
    },
    '& #vjt-arrow::before': {
      backgroundColor: 'tourGuide.default.background',
      boxShadow: 'tourGuide.default.shadow',
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
