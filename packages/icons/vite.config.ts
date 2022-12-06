import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { generateExports } from '@packages/generate-exports'

const pkg = require('./package.json')

const externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]
const externals = externalPackages.map(
  (packageName) => new RegExp(`^${packageName}(\/.*)?`),
)
const generateExportsPlugin = (...arg: Parameters<typeof generateExports>) => {
  const instance = generateExports(...arg)
  return {
    name: 'vite-plugin-generate-exports',
    buildStart() {
      instance.start()
    },
  }
}
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
          directories: ['./src/components/icons'],
        },
      ],
    }),
  ],
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
      output: [
        {
          dir: './dist',
          preserveModules: true,
          format: 'es',
          entryFileNames: '[name].js',
        },
        {
          dir: './dist',
          preserveModules: true,
          format: 'cjs',
          entryFileNames: '[name].cjs',
        },
      ],
      external: externals,
    },
  },
}))
