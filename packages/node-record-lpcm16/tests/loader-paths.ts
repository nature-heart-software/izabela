import * as nodePath from 'node:path'

export function resolveRecorderImport(
  filename: string,
  id: string,
  paths = nodePath,
) {
  const path = paths.resolve(paths.dirname(filename), id)
  return paths.basename(path) === 'recorders'
    ? paths.resolve(path, 'index.js')
    : path.endsWith('.js')
      ? path
      : path + '.js'
}

export function isLoaderFailure(
  filename: string,
  root: string,
  paths = nodePath,
) {
  return filename === paths.resolve(root, 'recorders', 'failure.js')
}
