import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ui = join(root, 'packages/ui')
const require = createRequire(join(ui, 'package.json'))
const processor = createRequire(require.resolve('vite-plugin-dts'))
const { createParsedCommandLine } = processor('@vue/language-core')
const configPath = join(ui, 'tests/tsconfig.build.json')
const { vueOptions } = createParsedCommandLine(ts, ts.sys, configPath)
const { vueOptions: normalizedOptions } = createParsedCommandLine(
  ts,
  ts.sys,
  configPath.replaceAll('\\', '/'),
)
const source = join(ui, 'src/main.ts')
const helper = vueOptions.globalTypesPath(source)
const normalizedHelper = normalizedOptions.globalTypesPath(
  source.replaceAll('\\', '/'),
)
const resolvedHelper = helper ? resolve(ui, helper) : null
console.log(
  JSON.stringify(
    {
      platform: process.platform,
      uiRoot: ui,
      processor: require.resolve('vite-plugin-dts'),
      languageCore: processor.resolve('@vue/language-core'),
      vueTarget: vueOptions.target,
      globalTypesPath: helper,
      normalizedConfigGlobalTypesPath: normalizedHelper,
      globalTypesResolvedFromUiCommand: resolvedHelper,
      globalTypesExists: resolvedHelper !== null && existsSync(resolvedHelper),
      globalTypesRealPath:
        resolvedHelper !== null && existsSync(resolvedHelper)
          ? realpathSync(resolvedHelper)
          : null,
      globalTypesBytes:
        resolvedHelper !== null && existsSync(resolvedHelper)
          ? statSync(resolvedHelper).size
          : null,
    },
    null,
    2,
  ),
)
for (const file of [
  'components/forms/Switch/NvSwitch.vue.d.ts',
  'components/forms/RangeInput/NvRangeInput.vue.d.ts',
  'main.d.ts',
]) {
  const path = join(ui, 'dist', file)
  console.log(`Declaration ${file}:`)
  console.log(existsSync(path) ? readFileSync(path, 'utf8') : 'MISSING')
}
for (const directory of [
  join(root, 'coverage/ui-types'),
  join(root, 'node_modules/.vue-global-types'),
]) {
  console.log(
    JSON.stringify({
      directory,
      files: existsSync(directory) ? readdirSync(directory) : [],
    }),
  )
}
