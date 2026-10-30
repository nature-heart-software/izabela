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
  npmRebuild: false,
  productName: pkg.productName,
  directories: {
    output: 'dist_electron',
  },
  files: [
    'dist',
    'dist-electron',
    '!node_modules/@packages/electron-game-overlay/build/**/*',
  ],
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
  afterPack: async (context) => {
    if (context.electronPlatformName !== 'win32') return
    // Default dependency pruning strips sealed notices such as CopyrightNotice.txt.
    // Restore the immutable SDK verbatim after ASAR creation and before installer/signing.
    const sdkRoot = path.dirname(
      require.resolve('electron-game-overlay/package.json'),
    )
    fs.cpSync(
      sdkRoot,
      path.join(
        context.appOutDir,
        'resources',
        'app.asar.unpacked',
        'node_modules',
        'electron-game-overlay',
      ),
      {
        recursive: true,
        dereference: true,
        // Ignore only pnpm's peer CLI wrappers; retain nested sealed node_modules.
        filter: (source) =>
          source !== path.join(sdkRoot, 'node_modules', '.bin'),
      },
    )
  },
  asarUnpack: [
    'node_modules/@nut-tree-fork/**/*',
    'node_modules/@packages/electron-game-overlay/**/*',
    'node_modules/electron-game-overlay/**/*',
    'node_modules/@packages/native-keymap/**/*',
    'node_modules/@packages/process-watcher/**/*',
    'node_modules/@packages/win-mouse/**/*',
    'node_modules/forcefocus/**/*',
    'node_modules/wql-process-monitor/**/*',
    'node_modules/win-control/**/*',
    'node_modules/windows-tlist/**/*',
    'node_modules/@xan105/error/**/*',
    'node_modules/@xan105/ffi/**/*',
    'node_modules/@xan105/is/**/*',
    'node_modules/emittery/**/*',
    'node_modules/koffi/**/*',
  ],
}
