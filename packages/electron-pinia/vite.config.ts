import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

const name = 'electron-pinia'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts()],
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
        `main.${
          {
            cjs: 'cjs',
            es: 'es.js',
          }[format]
        }`,
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'electron'],
    },
  },
})
