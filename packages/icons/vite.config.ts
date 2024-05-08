import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'
import { getRootExternal } from '../../utils/vite'

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
                    directories: ['./src/components/icons'],
                },
            ],
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'main',
            formats: ['cjs', 'es'],
            fileName: (format) =>
                `main.${
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
}))
