import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'

const pkg = require('./package.json')
const packagesToOmit = ['element-plus']
const omitPackages = (keys: string[]) =>
  keys.filter((key) => !packagesToOmit.includes(key))
const externalPackages = [
  ...omitPackages(Object.keys(pkg.dependencies || {})),
  ...omitPackages(Object.keys(pkg.peerDependencies || {})),
  ...omitPackages(Object.keys(pkg.devDependencies || {})),
]
const externals = externalPackages.map(
  (packageName) => new RegExp(`^${packageName}(\/.*)?`),
)

const mode = (() => {
  const args = process.argv
  const index = args.indexOf('--mode')
  return index < 0 ? 'production' : args[index + 1]
})()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts(),
    generateExportsPlugin({
      watch: mode === 'development',
      entries: [
        {
          omitExtension: false,
          omitSemi: true,
          filename: 'index.ts',
          include: ['**/*.vue'],
          exclude: ['**/Icons/*'],
          directories: ['./src/components'],
        },
        {
          omitExtension: false,
          omitSemi: true,
          filename: 'index.ts',
          include: ['**/*.vue'],
          exclude: ['**/*Story.vue'],
          directories: ['./src/components/typography/Icons'],
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'main',
      formats: ['cjs', 'es'],
      fileName: (format, entryName) =>
        `${entryName}.${
          {
            cjs: 'cjs',
            es: 'es.js',
          }[format]
        }`,
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.ts'),
        tokens: resolve(__dirname, 'src/styles/tokens.ts'),
      },
      external: externals,
    },
  },
})
