export type ModuleType = 'commonjs' | 'umd' | 'amd' | 'systemjs' | 'module'

export interface Entry {
  into: ModuleType | ModuleType[]
  pattern: string
}

export type BabelPluginsParams = {
  [key in ModuleType]: {
    plugin: any
    ext: string
  }
}
