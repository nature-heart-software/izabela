import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import { getRootExternal } from '../../utils/vite'

const pkg = require('./package.json')

export default defineConfig(({ mode }) => {
  const packagesToOmit = []
  const omitPackages = (keys: string[]) =>
    keys.filter((key) => !packagesToOmit.includes(key))
  const externalPackages = [
    ...omitPackages(Object.keys(pkg.dependencies || {})),
    ...omitPackages(Object.keys(pkg.peerDependencies || {})),
    ...(mode === 'development'
      ? omitPackages(Object.keys(pkg.devDependencies || {}))
      : []),
  ]
  const external = [
    ...externalPackages.map(
      (packageName) => new RegExp(`^${packageName}(/.*)?`),
    ),
    ...(mode === 'development' ? getRootExternal() : []),
  ]
  const resolve = {
    alias: {
      '@': path.join(__dirname, './src'),
      '@root': __dirname,
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  }
  const rollupOptions = {
    external,
  }
  const plugins = () => [tsconfigPaths()]
  return {
    server: {
      port: 3000,
    },
    resolve,
    build: {
      rollupOptions: {
        ...rollupOptions,
        input: {
          messenger: './src/teams/messenger/index.html',
          'speech-worker': './src/teams/speech-worker/index.html',
          overlay: './src/teams/overlay/index.html',
        },
      },
    },
    plugins: [
      ...plugins(),
      vue(),
      electron({
        main: {
          entry: 'src/electron/background.ts',
          vite: {
            resolve,
            build: {
              rollupOptions,
            },
            plugins: [...plugins()],
          },
        },
        preload: {
          input: path.join(__dirname, 'src/electron/preload.ts'),
          vite: {
            resolve,
            build: {
              rollupOptions,
            },
            plugins: [...plugins()],
          },
        },
      }),
    ],
  }
})
