import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'
import { getFileName, getFormats, getRootExternal } from '../../utils/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        vue(),
        dts(),
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
            external: [
                ...getRootExternal(['element-plus']),
            ],
        },
    },
}))
