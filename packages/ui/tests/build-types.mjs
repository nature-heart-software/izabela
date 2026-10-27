import { dirname, join, relative, resolve, sep } from 'node:path'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import ts, { DiagnosticCategory } from 'typescript'
import { normalizeDiagnosticSpan } from './diagnostic-spans.mjs'
import { createUiParsedCommandLine } from './vue-config.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const processorRequire = createRequire(require.resolve('vite-plugin-dts'))
const { createGlobalTypesWriter } = processorRequire('@vue/language-core')
const { vueOptions } = createUiParsedCommandLine(
  ts,
  ts.sys,
  join(root, 'tests/tsconfig.build.json'),
)
// The Vue declaration processor references helpers but does not generate them.
// Generate its matching helpers outside dist, independent of editor caches.
createGlobalTypesWriter(vueOptions, ts.sys.writeFile)(join(root, 'src/main.ts'))
const tokenRoot = resolve(root, '../design-tokens')
const dependencyArgs = [
  require.resolve('typescript/bin/tsc'),
  '-p',
  join(tokenRoot, 'tsconfig.json'),
  '--rootDir',
  join(tokenRoot, 'src'),
  '--outDir',
  join(tokenRoot, 'dist'),
  '--declaration',
  '--emitDeclarationOnly',
]
console.log(
  'Building real design-token declarations:',
  JSON.stringify([process.execPath, ...dependencyArgs]),
)
execFileSync(process.execPath, dependencyArgs, { stdio: 'inherit' })
// Use the production Vue declaration processor, without unrelated barrel generators.
let declarationsEmitted = false
await build({
  configFile: false,
  envFile: false,
  root,
  logLevel: 'warn',
  plugins: [
    vue(),
    dts({
      outDirs: join(root, 'dist'),
      tsconfigPath: join(root, 'tests/tsconfig.build.json'),
      entryRoot: join(root, 'src'),
      processor: 'vue',
      afterBuild() {
        declarationsEmitted = true
      },
      afterDiagnostic(diagnostics) {
        const errors = diagnostics.filter(
          ({ category }) => category === DiagnosticCategory.Error,
        )
        const baseline = new Set(
          JSON.parse(
            readFileSync(
              join(root, 'tests/declaration-template-baseline.json'),
              'utf8',
            ),
          ).map((diagnostic) => JSON.stringify(diagnostic)),
        )
        const { parse } = processorRequire('@vue/compiler-sfc')
        const unexpected = errors.filter(
          ({ file, start, length, code, messageText }) => {
            if (!file || start === undefined || !file.fileName.endsWith('.vue'))
              return true
            const template = parse(file.text).descriptor.template
            // Baseline only exact existing template diagnostics, never script errors.
            if (
              !template ||
              start < template.loc.start.offset ||
              start >= template.loc.end.offset
            )
              return true
            return !baseline.has(
              JSON.stringify({
                file: relative(root, file.fileName).split(sep).join('/'),
                ...normalizeDiagnosticSpan(file.text, start, length),
                code,
                message: ts.flattenDiagnosticMessageText(messageText, '\n'),
              }),
            )
          },
        )
        if (unexpected.length)
          throw new Error(
            `Declaration generation failed with ${unexpected.length} new TypeScript errors`,
          )
        if (errors.length)
          console.warn(
            `Declaration baseline: ${errors.length} existing template errors remain; public consumer checks run separately.`,
          )
      },
    }),
  ],
  resolve: { alias: { '@': join(root, 'src') } },
  build: {
    // writeBundle emits declarations; keep its required JS output out of dist.
    outDir: join(root, '../../coverage/ui-types/build'),
    write: true,
    emptyOutDir: false,
    lib: { entry: join(root, 'src/main.ts'), formats: ['es'] },
    rollupOptions: {
      external: (id) =>
        !id.startsWith('.') &&
        !id.startsWith('/') &&
        !id.startsWith('@/') &&
        !/^[A-Za-z]:[\\/]/.test(id),
    },
  },
})
if (!declarationsEmitted)
  throw new Error('Vue declaration emission did not run')
// Publish portable relative specifiers, never the workspace-only @ alias.
function rewrite(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) rewrite(path)
    else if (entry.name.endsWith('.d.ts')) {
      const source = readFileSync(path, 'utf8')
      writeFileSync(
        path,
        source.replace(/(['"])@\/([^'"]+)\1/g, (_, quote, suffix) => {
          let target = relative(dirname(path), join(root, 'dist', suffix))
            .split(sep)
            .join('/')
          if (!target.startsWith('.')) target = './' + target
          return quote + target + quote
        }),
      )
    }
  }
}
rewrite(join(root, 'dist'))
