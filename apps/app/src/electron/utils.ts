import path from 'path'

export const env = process.env.NODE_ENV
export const EXTERNALS_DIR =
  env === 'development'
    ? path.join(ROOT_DIR, '/resources')
    : path.join(process.resourcesPath, '/resources')
