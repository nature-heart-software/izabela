const path = require('path')
const { defineConfig } = require('@vue/cli-service')
const GenerateExportsPlugin = require('@izabela/generate-exports-webpack-plugin')
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
      new GenerateExportsPlugin([
        {
          omitExtension: false,
          omitSemi: true,
          filename: 'index.ts',
          include: ['**/*.vue'],
          exclude: ['**/Icons/*'],
          directories: ['./src/core/components'],
        },
        {
          omitExtension: false,
          omitSemi: true,
          filename: 'index.ts',
          include: ['**/*.vue'],
          exclude: ['**/*Story.vue'],
          directories: ['./src/core/components/Icons'],
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
