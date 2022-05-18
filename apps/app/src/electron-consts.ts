import path from 'path'

export const rootPath = process.env.NODE_ENV === 'production' ? __static : path.resolve()
