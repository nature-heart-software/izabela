const { readFileSync } = require('node:fs')
const { createRequire } = require('node:module')
const { dirname, resolve } = require('node:path')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')

module.exports = function loadTypescript(
  filename,
  mocks = {},
  globals = {},
  sourceText = readFileSync(filename, 'utf8'),
) {
  const source = sourceText.replaceAll('import.meta.env', '__importMetaEnv')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  })
  const module = { exports: {} }
  const require = createRequire(filename)
  runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      require(id) {
        if (Object.hasOwn(mocks, id)) return mocks[id]
        if (id.startsWith('.')) {
          return loadTypescript(
            resolve(dirname(filename), `${id.replace(/\.ts$/, '')}.ts`),
            mocks,
            globals,
          )
        }
        if (id.startsWith('@/')) throw new Error(`Unmocked app import: ${id}`)
        return require(id)
      },
      URL,
      Response,
      __importMetaEnv: {},
      ...globals,
    },
    { filename },
  )
  return module.exports
}
