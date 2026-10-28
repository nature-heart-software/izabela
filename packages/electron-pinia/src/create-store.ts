/** Preserve damaged data before allowing a store to start with its defaults. */
export function createStore(
  Store: any,
  options: any,
  userData: string | (() => string),
) {
  try {
    return new Store(options)
  } catch (error) {
    // Permission and filesystem errors must never be mistaken for corrupt JSON.
    if (
      !(error instanceof SyntaxError) &&
      (error as Error)?.name !== 'SyntaxError'
    )
      throw error
    const { existsSync, renameSync } = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const { randomUUID } = require('crypto') as typeof import('crypto')
    const filename = path.join(
      typeof userData === 'function' ? userData() : userData,
      options.cwd,
      `${options.name}.json`,
    )
    if (!existsSync(filename)) throw error
    renameSync(filename, `${filename}.corrupt-${randomUUID()}`)
    return new Store(options)
  }
}
