import path from 'path'

export const { NODE_ENV } = process.env
export const EXTERNALS_DIR =
  NODE_ENV === 'production'
    ? path.join(process.resourcesPath, '/resources')
    : path.join(ROOT_DIR, '/resources')
