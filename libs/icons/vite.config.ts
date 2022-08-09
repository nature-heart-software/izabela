import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
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
const name = 'icons'
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
        directories: ['./src/components/icons'],
      },
    ]),
  ],
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
