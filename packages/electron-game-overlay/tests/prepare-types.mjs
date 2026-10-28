import { createRequire } from 'node:module'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const source = path.join(
  path.dirname(require.resolve('gelectron/package.json')),
  'electron-overlay',
)
const output = fileURLToPath(new URL('../dist/', import.meta.url))
await mkdir(output, { recursive: true })
// Stage the native package's real JS/declaration entries without compiling or loading its addon.
await copyFile(path.join(source, 'index.js'), path.join(output, 'index.js'))
await copyFile(path.join(source, 'index.js'), path.join(output, 'index.cjs'))
await copyFile(path.join(source, 'index.d.ts'), path.join(output, 'index.d.ts'))
