import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import generateExports from 'generate-exports'

const generateExportsPlugin = (...arg: Parameters<typeof generateExports>) => {
  const instance = generateExports(...arg)
  return {
    name: 'vite-plugin-generate-exports',
    buildStart() {
      instance.start()
    },
  }
}

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
      fileName: (format) => `${name}.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
})
