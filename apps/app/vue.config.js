const path = require('path')
const { defineConfig } = require('@vue/cli-service')
const { GenerateExportsPlugin } = require('@packages/generate-exports-webpack-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
const fs = require('fs')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

function getElectronVersion() {
  const electronPath = require.resolve('electron')

  const data = fs.readFileSync(path.join(electronPath, '..', 'package.json'))
  const version = JSON.parse(data.toString())?.version
  return version
}

const setConfigAliases = (config) => {
  config.resolve.alias.set('@root', path.resolve(__dirname, './'))
}

module.exports = defineConfig({
  pages: {
    messenger: './src/teams/messenger/main.ts',
    'speech-worker': './src/teams/speech-worker/main.ts',
  },
  transpileDependencies: ['@izabela'],
  configureWebpack: {
    plugins: [
      new WebpackNotifierPlugin({ emoji: true }),
      new GenerateExportsPlugin({
        watch: process.env.NODE_ENV === 'development',
        entries: [
          {
            omitExtension: true,
            omitSemi: true,
            filename: 'index.ts',
            include: ['**/*.ts'],
            directories: ['./src/hooks'],
          },
        ],
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
      }),
    ],
  },
  chainWebpack: (config) => {
    setConfigAliases(config)

    // // https://github.com/vuejs/core/issues/4344#issuecomment-912627569
    // config.resolve.symlinks(false)
    // config.resolve.alias.set('vue', path.resolve('../../node_modules/vue'))
  },
  pluginOptions: {
    electronBuilder: {
      externals: [
        'win-mouse',
        '@izabela/app-server',
        '@google-cloud/speech',
        '@packages/native-keymap',
        '@vue-reactivity/watch',
      ],
      chainWebpackMainProcess: (config) => {
        setConfigAliases(config)
        config.module
          .rule('module')
          .test(/\.mjs$/)
          .include.add(/node_modules/)
          .end()
          .type('javascript/auto')
          .end()

        config.plugin('define').tap((definitions) => {
          // eslint-disable-next-line no-param-reassign
          definitions[0] = Object.assign(definitions[0], {
            __VUE_OPTIONS_API__: false,
            __VUE_PROD_DEVTOOLS__: false,
            ROOT_DIR: JSON.stringify(__dirname),
          })
          return definitions
        })
      },
      /* Documentation:
       * https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/configuration.html
       */
      mainProcessFile: 'src/electron/background.ts',
      mainProcessWatch: [
        './src/**/{electron,node}*/*',
        './src/**/{electron,node}*',
        './src/**/store/*',
        '../../libs/**/{electron,node}*/*',
        '../../libs/**/{electron,node}*',
      ],
      preload: {
        preload: 'src/electron/preload.ts',
      },
      builderOptions: {
        appId: 'com.nhs.izabela',
        beforeBuild: './scripts/electron-builder-before-build.js',
        generateUpdatesFilesForAllChannels: true,
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: '${name}-setup-${version}-${os}.${ext}',
        publish: ['github'],
        electronVersion: getElectronVersion(),
        extraFiles: ['./resources/**'],
      },
    },
  },
})
