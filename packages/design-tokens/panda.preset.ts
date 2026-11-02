import { tokens } from './src/main'

const tokenLeaves = (
  values: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value && typeof value === 'object' && !Array.isArray(value)
        ? tokenLeaves(value as Record<string, unknown>)
        : { value },
    ]),
  )

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
      colors: tokenLeaves(tokens.colors),
      fonts: tokenLeaves(
        Object.fromEntries(
          Object.entries(tokens.fontFamily).map(([key, value]) => [
            key,
            value.join(', '),
          ]),
        ),
      ),
      fontSizes: tokenLeaves(
        Object.fromEntries(
          Object.entries(tokens.fontSize).map(([key, value]) => [
            key,
            `${Number(value[0]) / 16}rem`,
          ]),
        ),
      ),
      lineHeights: tokenLeaves(
        Object.fromEntries(
          Object.entries(tokens.fontSize).map(([key, value]) => [
            key,
            String((value[1] as { lineHeight: number }).lineHeight),
          ]),
        ),
      ),
      letterSpacings: tokenLeaves(
        Object.fromEntries(
          Object.entries(tokens.fontSize).map(([key, value]) => [
            key,
            `${(value[1] as { letterSpacing: number }).letterSpacing / 16}rem`,
          ]),
        ),
      ),
      borderWidths: {
        thin: { value: `${tokens.borderWidth.DEFAULT}px` },
        thick: { value: `${tokens.borderWidth.lg}px` },
      },
      spacing: tokenLeaves(
        Object.fromEntries(
          Object.entries(tokens.spacing).map(([key, value]) => [
            key,
            `${value / 16}rem`,
          ]),
        ),
      ),
      sizes: tokenLeaves(
        Object.fromEntries(
          Object.entries(tokens.spacing).map(([key, value]) => [
            key,
            `${value / 16}rem`,
          ]),
        ),
      ),
      radii: tokenLeaves(
        Object.fromEntries(
          Object.entries(tokens.borderRadius).map(([key, value]) => [
            key,
            `${value / 16}rem`,
          ]),
        ),
      ),
      shadows: tokenLeaves(tokens.boxShadow),
    },
    keyframes: {
      spin: { to: { transform: 'rotate(360deg)' } },
      'nv-tooltip-in': { from: { opacity: 0 }, to: { opacity: 1 } },
    },
  },
}
