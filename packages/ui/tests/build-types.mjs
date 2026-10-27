import { dirname, join, relative, resolve, sep } from 'node:path'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { DiagnosticCategory } from 'typescript'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
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
await build({
  configFile: false,
  envFile: false,
  root,
  logLevel: 'warn',
  plugins: [
    vue(),
    dts({
      tsconfigPath: join(root, 'tests/tsconfig.build.json'),
      entryRoot: join(root, 'src'),
      processor: 'vue',
      afterDiagnostic(diagnostics) {
        const errors = diagnostics.filter(
          ({ category }) => category === DiagnosticCategory.Error,
        )
        if (errors.length)
          throw new Error(
            `Declaration generation failed with ${errors.length} TypeScript errors`,
          )
      },
    }),
  ],
  resolve: { alias: { '@': join(root, 'src') } },
  build: {
    write: false,
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
