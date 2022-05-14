export type Options = {
  omitExtension?: boolean
  omitSemi?: boolean
  singleQuote?: boolean
  filename?: string
  include: string[]
  exclude?: string[]
}
export type DirectoriesOption = { directories: string[] | [string, Options][] }
export type PluginOptions = Options & DirectoriesOption
