const path = require('path')
const { defineConfig } = require('@vue/cli-service')
const { GenerateExportsPlugin } = require('@packages/generate-exports-webpack-plugin')
const GenerateModulesPlugin = require('@wurielle/generate-modules-webpack-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')

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
      new GenerateModulesPlugin([
        {
          pattern: './src/styles/tokens.ts',
          into: ['commonjs'],
        },
      ]),
    ],
  },
  chainWebpack: (config) => {
    setConfigAliases(config)

    // https://github.com/vuejs/core/issues/4344#issuecomment-912627569
    config.resolve.symlinks(false)
    config.resolve.alias.set('vue', path.resolve('./node_modules/vue'))
  },
  pluginOptions: {
    electronBuilder: {
      externals: [
        'iohook',
        '@izabela/app-server',
        '@google-cloud/speech',
        'native-keymap',
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
      },
    },
  },
})
