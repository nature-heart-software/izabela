import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'
import { getFileName, getFormats, getRootExternal } from '../../utils/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        dts(),
        generateExportsPlugin({
            watch: mode === 'development',
            entries: [
                {
                    exportAllAsAlias: false,
                    exportAll: true,
                    omitSemi: true,
                    filename: 'index.ts',
                    include: ['**/*.ts'],
                    exclude: ['**/index.*'],
                    directories: ['./src/utils'],
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
            external: [
                ...getRootExternal(),
            ],
        },
    },
}))
