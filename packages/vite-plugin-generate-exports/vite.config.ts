import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

const name = 'vite-plugin-generate-exports'
export default defineConfig({
  plugins: [dts()],
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
  },
})
