const config = require('../../apps/app/electron-builder.config.js')
const { candidate } = require('./update-versions.cjs')
module.exports = {
  ...config,
  directories: { ...config.directories, output: 'dist_updater' },
  extraMetadata: { version: candidate },
}
