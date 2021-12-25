export type Options = {
    omitExtensionInExportPath?: boolean,
    filename?: string,
    include: string[],
    exclude?: string[],
}
export type DirectoriesOption = { directories: string[]|[string, Options][] }
export type PluginOptions = Options & DirectoriesOption
