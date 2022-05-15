const path = require('path')
const { defineConfig } = require('@vue/cli-service')
const GenerateExportsPlugin = require('@izabela/generate-exports-webpack-plugin')
const GenerateModulesPlugin = require('@wurielle/generate-modules-webpack-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')

const setConfigAliases = (config) => {
  config.resolve.alias.set('@package', path.resolve(__dirname, './package.json'))
}

module.exports = defineConfig({
  transpileDependencies: ['@izabela'],
  configureWebpack: {
    plugins: [
      new WebpackNotifierPlugin({ emoji: true }),
      new GenerateExportsPlugin([
        {
          omitExtension: false,
          omitSemi: true,
          filename: 'index.ts',
          include: ['**/*.vue'],
          directories: ['./src/core/components'],
        },
        {
          omitExtension: true,
          omitSemi: true,
          filename: 'index.ts',
          include: ['**/*.ts'],
          directories: ['./src/hooks'],
        },
      ]),
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
  },
  pluginOptions: {
    electronBuilder: {
      externals: ['iohook', '@izabela/app-server', '@google-cloud/speech'],
      chainWebpackMainProcess: (config) => {
        setConfigAliases(config)
        config.module.rule('babel').before('ts').use('babel').loader('babel-loader').end()
      },
      /* Documentation:
       * https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/configuration.html
       */
      mainProcessWatch: [
        './src/**/{electron,node}*/*',
        './src/**/{electron,node}*',
        '../../libs/**/{electron,node}*/*',
        '../../libs/**/{electron,node}*',
      ],
      preload: {
        preload: 'src/preload.ts',
      },
      builderOptions: {
        beforeBuild: './scripts/electron-builder-before-build.js',
        generateUpdatesFilesForAllChannels: true,
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: '${name}-setup-${version}-${channel}-${os}.${ext}',
        publish: ['github'],
      },
    },
  },
})
