import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const cli = join(
  dirname(require.resolve('@pandacss/dev/package.json')),
  'bin.js',
)
const cwd = fileURLToPath(new URL('..', import.meta.url))
for (const command of ['codegen', 'cssgen']) {
  execFileSync(process.execPath, [cli, command], { cwd, stdio: 'pipe' })
}
