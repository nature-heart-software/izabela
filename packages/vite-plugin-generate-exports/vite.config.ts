import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { getRootExternal } from '../../utils/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        dts(),
    ],
    build: {
        emptyOutDir: false,
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'main',
            formats: ['cjs', 'es'],
            fileName: (format, entryName) =>
                `${ entryName }.${
                    {
                        cjs: 'cjs',
                        es: 'js',
                    }[format]
                }`,
        },
        rollupOptions: {
            external: [
                ...getRootExternal(),
            ],
        },
    },
})
