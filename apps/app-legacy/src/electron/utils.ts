import path from 'path'
import { screen } from 'electron'
import { minBy } from 'lodash'

export const env = process.env.NODE_ENV
export const EXTERNALS_DIR =
  env === 'development' ? path.join(ROOT_DIR, '/resources') : process.resourcesPath

export const getTopLeftWindow = () => {
  const displays = screen.getAllDisplays()
  return minBy(displays, (display) => display.bounds.y)
}
