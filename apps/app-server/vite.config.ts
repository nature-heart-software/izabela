import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { createRequire } from 'node:module'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'
import { getNodeExternal } from '../../utils/vite'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')
const externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
]
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default defineConfig(({ mode }) => ({
  plugins: [
    generateExportsPlugin({
      watch: mode === 'development',
      entries: [
        {
          omitExtension: true,
          omitSemi: true,
          filename: 'index.ts',
          include: ['**/*.ts'],
          directories: ['./src/plugins'],
        },
      ],
    }),
    dts(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['cjs'],
      fileName: () => 'main.cjs',
    },
    rollupOptions: {
      external: [
        ...getNodeExternal(),
        ...externalPackages.map(
          (packageName) => new RegExp(`^${escapeRegExp(packageName)}(/.*)?`),
        ),
      ],
    },
  },
}))
