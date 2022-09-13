import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'
import { generateModulesPlugin } from '@packages/vite-plugin-generate-modules'

const mode = (() => {
  const args = process.argv
  const index = args.indexOf('--mode')
  return index < 0 ? 'production' : args[index+1]
})()

const name = 'ui'
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
      name: name,
      formats: ['cjs', 'es'],
      fileName: (format) =>
          `${ name }.${
              {
                cjs: 'cjs',
                es: 'es.js',
              }[format]
          }`,
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
})
