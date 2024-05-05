import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

const pkg = require('./package.json')

export default defineConfig(({ mode }) => {
  // console.log(process.env)
  const packagesToOmit = []
  const omitPackages = (keys: string[]) => keys.filter((key) => !packagesToOmit.includes(key))
  const externalPackages = [
    ...omitPackages(Object.keys(pkg.dependencies || {})),
    ...omitPackages(Object.keys(pkg.peerDependencies || {})),
    ...(mode === 'development' ? omitPackages(Object.keys(pkg.devDependencies || {})) : []),
  ]
  const external = externalPackages.map((packageName) => new RegExp(`^${packageName}(/.*)?`))
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
  // const define = {
  //   'process.env.PUBLIC_DIR': JSON.stringify(mode === 'development' ? path.join(__dirname, 'public') : __dirname),
  //   'process.env.ROOT_DIR': JSON.stringify(__dirname),
  //   'process.env.ELECTRON_NODE_INTEGRATION': JSON.stringify(Number(false).toString()),
  //   'process.env.VITE_DEV_SERVER_URL': JSON.stringify(mode === 'development' ? 'http://localhost:3000' : 'app://./'),
  // }
  const plugins = () => [
    tsconfigPaths(),
    // nodeResolve(),
    // EnvironmentPlugin({
    //   'PUBLIC_DIR': `"${ mode === 'developement' ? path.join(__dirname, 'public') : __dirname }"`,
    //   'ROOT_DIR': `"${ __dirname }"`,
    //   'ELECTRON_NODE_INTEGRATION': 'false',
    // }),
  ]
  return {
    server: {
      port: 3000,
    },
    resolve,
    plugins: [
      ...plugins(),
      vue(),
      electron({
        main: {
          // onstart(ctx) {
          //   ctx.startup(['.'], {
          //     env: {
          //       'PUBLIC_DIR': mode === 'development' ? path.join(__dirname, 'public') : __dirname,
          //       'ROOT_DIR': __dirname,
          //       'ELECTRON_NODE_INTEGRATION': Number(false).toString(),
          //       'VITE_DEV_SERVER_URL': mode === 'development' ? 'http://localhost:3000' : 'app://./',
          //     },
          //   })
          // },
          // Shortcut of `build.lib.entry`.
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
        vite: {
          resolve,
          plugins: [...plugins()],
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
        },
      }),
    ],
  }
})
