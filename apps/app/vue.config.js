const PrettierPlugin = require('prettier-webpack-plugin');
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: [
    '@izabela'
  ],
  configureWebpack: {
    plugins: [
      new PrettierPlugin({
        tabWidth: 2,
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'always',
        endOfLine: 'auto',
      }),
    ]
  },
  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: config => {
        config.module
          .rule('babel')
          .before('ts')
          .use('babel')
          .loader('babel-loader')
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
      }
    }
  }
});
