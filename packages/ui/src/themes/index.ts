import light from './light'
export const themes = new Map<'light' | 'dark', typeof light>([
  ['light', light],
])
