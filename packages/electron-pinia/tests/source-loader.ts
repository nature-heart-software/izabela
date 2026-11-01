import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

/** Evaluate the real module graph with explicit native-process boundaries. */
export function sourceLoader(
  boundaries: Record<string, unknown>,
  globals: Record<string, unknown> = {},
) {
  const cache = new Map<string, { exports: any }>()
  function load(filename: string): any {
    const file = resolve(filename)
    if (cache.has(file)) return cache.get(file)!.exports
    const module = { exports: {} as any }
    cache.set(file, module)
    const nativeRequire = createRequire(file)
    const require = (id: string): any => {
      if (Object.hasOwn(boundaries, id)) return boundaries[id]
      if (id.startsWith('.')) {
        const base = resolve(dirname(file), id)
        return load(
          [base, `${base}.ts`, `${base}.js`].find((p) => existsSync(p))!,
        )
      }
      if (id === 'electron' || id === 'electron-store')
        throw new Error(`Uncontrolled native import: ${id}`)
      return nativeRequire(id)
    }
    const input = readFileSync(file, 'utf8')
    const code = file.endsWith('.ts')
      ? ts.transpileModule(input, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
          },
        }).outputText
      : input
    const wrapper = runInNewContext(
      `(function(require, module, exports, __filename, __dirname) {${code}\n})`,
      { console, setTimeout, clearTimeout, ...globals },
      { filename: file, timeout: 1000 },
    )
    wrapper(require, module, module.exports, file, dirname(file))
    return module.exports
  }
  return load
}
