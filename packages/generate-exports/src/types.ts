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
export type DirectoriesOption = { directories: string[] | [string, Options][] }
export type Entry = Options & DirectoriesOption
