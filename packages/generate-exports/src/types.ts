/** Barrel formatting and glob selection.
 * @example
 * ```ts
 * import type { Options } from '@packages/generate-exports'
 * const options: Options = { include: ['*.ts'], exclude: ['*.spec.ts'] }
 * ```
 */
export type Options = {
  exportAll?: boolean
  exportAllAsAlias?: boolean
  omitExtension?: boolean
  omitSemi?: boolean
  singleQuote?: boolean
  filename?: string
  include: string[]
  exclude?: string[]
}

/** Source directories, optionally paired with overrides of the enclosing entry.
 * @example
 * ```ts
 * import type { DirectoriesOption } from '@packages/generate-exports'
 * const paths: DirectoriesOption = {
 *   directories: ['src', ['components', { filename: 'index.ts' }]],
 * }
 * ```
 */
export type DirectoriesOption = {
  directories: (string | [string, Partial<Options>])[]
}

/** A complete entry with include patterns and one or more source directories.
 * @example
 * ```ts
 * import type { Entry } from '@packages/generate-exports'
 * const entry: Entry = { include: ['*.ts'], directories: ['src'] }
 * ```
 */
export type Entry = Options & DirectoriesOption
