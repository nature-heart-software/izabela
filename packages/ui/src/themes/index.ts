import light from './light'
import dark from './dark'
export { ThemeProvider } from './provider'
export const themes = new Map<'light' | 'dark', typeof light | typeof dark>([
  ['light', light],
  ['dark', dark],
])
