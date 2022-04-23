const { defineConfig } = require('@vue/cli-service')
const GenerateExportsWebpackPlugin = require('@izabela/generate-exports-webpack-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')

module.exports = defineConfig({
  transpileDependencies: ['@izabela'],
  configureWebpack: {
    plugins: [
      new WebpackNotifierPlugin({ emoji: true }),
      new GenerateExportsWebpackPlugin({
        omitExtension: false,
        omitSemi: true,
        filename: 'index.ts',
        include: ['**/*.vue'],
        directories: [
          './src/core/components',
          [
            './src/hooks',
            {
              omitExtension: true,
              omitSemi: true,
              filename: 'index.ts',
              include: ['**/*.ts'],
            },
          ],
        ],
      }),
    ],
  },
  pluginOptions: {
    electronBuilder: {
      externals: ['iohook', '@izabela/app-server'],
      chainWebpackMainProcess: (config) => {
        config.module.rule('babel').before('ts').use('babel').loader('babel-loader')
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
    },
  },
})
