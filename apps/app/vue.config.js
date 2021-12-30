const { defineConfig } = require('@vue/cli-service')
const GenerateExportsWebpackPlugin = require('@izabela/generate-exports-webpack-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')

module.exports = defineConfig({
  transpileDependencies: ['@izabela'],
  configureWebpack: {
    plugins: [
      new WebpackNotifierPlugin({ emoji: true }),
      new GenerateExportsWebpackPlugin({
        omitExtensionInExportPath: false,
        filename: 'index.ts',
        directories: ['./src/core/components'],
        include: ['**/*.vue'],
      }),
    ],
  },
  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: (config) => {
        config.module.rule('babel').before('ts').use('babel').loader('babel-loader')
      },
      /* Documentation:
       * https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/configuration.html
       */
      mainProcessWatch: [
        './src/**/electron-*/*',
        './src/**/electron-*',
        '../../libs/**/electron-*/*',
        '../../libs/**/electron-*',
        './src/**/node-*/*',
        './src/**/node-*',
        '../../libs/**/node-*/*',
        '../../libs/**/node-*',
      ],
      preload: {
        preload: 'src/preload.ts',
      },
    },
  },
})
