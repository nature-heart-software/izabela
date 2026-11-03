import { tokens } from './src/main'
import generated from './src/figma.generated.json'

const leaves = (
  values: Record<string, number | string>,
  convert: (value: number | string) => string = String,
) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      { value: convert(value) },
    ]),
  )
const rem = (value: number | string) => `${Number(value) / 16}rem`

export const pandaLayers = {
  reset: 'reset',
  base: 'panda_base',
  tokens: 'tokens',
  recipes: 'recipes',
  utilities: 'panda_utilities',
}

export const pandaTheme = {
  extend: {
    tokens: {
      colors: {},
      fonts: leaves(tokens.fontFamily),
      fontSizes: leaves(tokens.fontSize, rem),
      lineHeights: leaves(tokens.lineHeight),
      letterSpacings: leaves(tokens.letterSpacing, rem),
      borderWidths: leaves(tokens.border, (value) => `${value}px`),
      spacing: leaves(tokens.spacing, rem),
      sizes: leaves(tokens.spacing, rem),
      radii: leaves(tokens.radius, rem),
    },
    semanticTokens: generated.semanticTokens,
    keyframes: {
      spin: { to: { transform: 'rotate(360deg)' } },
      'nv-tooltip-in': { from: { opacity: 0 }, to: { opacity: 1 } },
    },
  },
}
