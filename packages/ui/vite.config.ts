import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'
import {
  declarations as dts,
  getFileName,
  getFormats,
  getRootExternal,
} from '../../utils/vite'

const require = createRequire(import.meta.url)
const processorRequire = createRequire(require.resolve('vite-plugin-dts'))
const { createParsedCommandLine, createGlobalTypesWriter } =
  processorRequire('@vue/language-core')
const declarationConfig = resolve(__dirname, 'tsconfig.build.json')
const { vueOptions } = createParsedCommandLine(
  ts,
  ts.sys,
  declarationConfig.replace(/\\/g, '/'),
)
// The Vue declaration processor references these helpers but does not emit them.
createGlobalTypesWriter(
  vueOptions,
  ts.sys.writeFile,
)(resolve(__dirname, 'src/main.ts'))

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      processor: 'vue',
      tsconfigPath: declarationConfig,
    }),
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
      formats: getFormats(),
      fileName: (...args) => getFileName(...args),
    },
    rollupOptions: {
      external: [...getRootExternal()],
    },
  },
}))
