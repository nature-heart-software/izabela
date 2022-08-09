import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import generateExportsPlugin from 'vite-plugin-generate-exports'
import generateModulesPlugin from 'vite-plugin-generate-modules'

const name = 'ui'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts(),
    generateExportsPlugin([
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
    ]),
    generateModulesPlugin([
      {
        pattern: './src/styles/tokens.ts',
        into: ['commonjs'],
      },
    ]),
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
        `${name}.${
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
