/**
 * @see https://www.electron.build/configuration/configuration
 */
const path = require('path')
const fs = require('fs')
const pkg = require('./package.json')

function getElectronVersion() {
  const electronPath = require.resolve('electron')

  const data = fs.readFileSync(path.join(electronPath, '..', 'package.json'))
  const version = JSON.parse(data.toString())?.version
  return version
}

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  $schema:
    'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  asar: true,
  productName: pkg.productName,
  directories: {
    output: 'dist_electron',
  },
  files: ['dist', 'dist-electron'],
  nsis: {
    oneClick: true,
    perMachine: false,
    allowToChangeInstallationDirectory: false,
    deleteAppDataOnUninstall: false,
  },
  appId: 'com.nhs.izabela',
  generateUpdatesFilesForAllChannels: true,
  // eslint-disable-next-line no-template-curly-in-string
  artifactName: '${name}-setup-${version}-${os}.${ext}',
  publish: ['github'],
  electronVersion: getElectronVersion(),
  extraFiles: ['./resources/**'],
}
