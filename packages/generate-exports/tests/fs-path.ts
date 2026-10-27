import path from 'node:path'

export function isSameFilePath(
  observed: unknown,
  expected: string,
  paths: Pick<typeof path, 'resolve'> = path,
) {
  return (
    typeof observed === 'string' &&
    paths.resolve(observed) === paths.resolve(expected)
  )
}
