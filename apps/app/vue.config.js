const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: [
    '@izabela'
  ],
  pluginOptions: {
    electronBuilder: {
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
        plugins: 'src/preloads/plugins.js',
      }
    }
  }
});
