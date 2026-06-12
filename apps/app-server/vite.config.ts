import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { generateExportsPlugin } from '@packages/vite-plugin-generate-exports'
import { getNodeExternal } from '../../utils/vite'

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
      external: getNodeExternal(),
    },
  },
}))
