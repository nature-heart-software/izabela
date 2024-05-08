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
            input: {
                main: resolve(__dirname, 'src/main.ts'),
                renderer: resolve(__dirname, 'src/renderer.ts'),
                preload: resolve(__dirname, 'src/preload.ts'),
            },
            external: [
                ...getRootExternal(),
            ],
        },
    },
})
