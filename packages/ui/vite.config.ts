import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'
import { generateModulesPlugin } from '@packages/vite-plugin-generate-modules'

const pkg = require('./package.json')
const packagesToOmit = ['element-plus']
const omitPackages = (keys: string[]) =>
  keys.filter((key) => !packagesToOmit.includes(key))
const externalPackages = [
  ...omitPackages(Object.keys(pkg.dependencies || {})),
  ...omitPackages(Object.keys(pkg.peerDependencies || {})),
]
const externals = externalPackages.map(
  (packageName) => new RegExp(`^${packageName}(\/.*)?`),
)
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
    generateModulesPlugin({
      watch: mode === 'development',
      entries: [
        {
          pattern: './src/styles/tokens.ts',
          into: ['commonjs'],
        },
        {
          pattern: './vite.config.ts',
          into: ['commonjs'],
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
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'main',
      formats: ['cjs', 'es'],
      fileName: (format) =>
        `main.${
          {
            cjs: 'cjs',
            es: 'es.js',
          }[format]
        }`,
    },
    rollupOptions: {
      external: externals,
    },
  },
}))
