import generated from '../../../design-tokens/src/figma.generated.json'
export { ThemeProvider } from './provider'

/**
 * A complete imported variable selection for one authored theme mode.
 * @example
 * ```ts
 * const selected: Theme = resolveTheme('github-dark')
 * ```
 */
export type Theme = typeof generated.themes[number]['values']

/**
 * Every authored mode, using its source label and selection key.
 * @example
 * ```ts
 * const selectProps = { options: themeOptions }
 * ```
 */
export const themeOptions = generated.themes.map(({ id, label }) => ({
  value: id,
  label,
}))

/**
 * Canonically named theme values indexed by selection key.
 * @example
 * ```ts
 * const github = themes.get('github-dark')
 * ```
 */
export const themes = new Map<string, Theme>(
  generated.themes.map(({ id, values }) => [id, values]),
)

/**
 * Resolve a saved selection to an ID present in the generated theme options.
 * @param id - Saved selection key or a legacy light/dark preference.
 * @returns The canonical selection key, falling back to the authored default.
 * @example
 * ```ts
 * const selectProps = {
 *   options: themeOptions,
 *   modelValue: resolveThemeId('light'), // 'izabela-light'
 * }
 * ```
 */
export function resolveThemeId(id: string): string {
  if (themes.has(id)) return id
  const legacy =
    id === 'light' ? 'izabela-light' : id === 'dark' ? 'izabela-dark' : id
  return themes.has(legacy) ? legacy : generated.defaultThemeId
}

/**
 * Resolve a saved selection, including pre-import light/dark preferences.
 * @param id - Saved selection key or a legacy light/dark preference.
 * @returns The selected theme, or the authored default mode when unavailable.
 * @example
 * ```ts
 * const theme = resolveTheme('github-dark')
 * ```
 */
export function resolveTheme(id: string): Theme {
  return themes.get(resolveThemeId(id))!
}
