import { defineConfig } from 'vite'
import { resolve } from 'path'
import {
  declarations as dts,
  getFileName,
  getFormats,
  getRootExternal,
} from '../../utils/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts({ entryRoot: 'src' })],
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
})
