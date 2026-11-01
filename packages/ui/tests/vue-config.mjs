import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const processorRequire = createRequire(require.resolve('vite-plugin-dts'))
const { createParsedCommandLine } = processorRequire('@vue/language-core')

export function createUiParsedCommandLine(ts, host, configFileName) {
  // Match unplugin-dts: language-core resolves config roots with POSIX paths.
  return createParsedCommandLine(ts, host, configFileName.replace(/\\/g, '/'))
}
