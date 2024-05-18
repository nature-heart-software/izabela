import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { getFileName, getFormats, getRootExternal } from '../../utils/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        dts(),
    ],
    build: {
        emptyOutDir: false,
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            formats: getFormats(),
            fileName: (...args) => getFileName(...args),
        },
        rollupOptions: {
            external: [
                ...getRootExternal(),
            ],
        },
    },
})
