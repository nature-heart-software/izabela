import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

const pkg = require('./package.json')

const externalPackages = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
]
const externals = externalPackages.map(
    (packageName) => new RegExp(`^${packageName}(\/.*)?`),
)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        dts(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'main',
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
            external: externals,
        },
    },
}))
