import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInThisContext } from 'node:vm'

const entry = fileURLToPath(new URL('../src/js/index.js', import.meta.url))
export function loadControl(binding: unknown, loadError?: Error) {
  const module = { exports: {} as any }
  const nativePath = resolve(
    dirname(entry),
    '../../lib/binding/wincontrol.node',
  )
  const requests: string[] = []
  const require = createRequire(entry)
  const controlledRequire = (id: string) => {
    requests.push(id)
    if (id === 'path') return require(id)
    if (id === nativePath) {
      if (loadError) throw loadError
      return binding
    }
    throw new Error(`Unexpected module boundary: ${id}`)
  }
  const evaluate = runInThisContext(
    `(function(require,module,exports,__filename,__dirname){${readFileSync(entry, 'utf8')}\n})`,
    { filename: entry },
  )
  evaluate(controlledRequire, module, module.exports, entry, dirname(entry))
  return { api: module.exports, requests, nativePath }
}
