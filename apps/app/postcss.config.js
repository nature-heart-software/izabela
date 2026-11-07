const path = require('node:path')

module.exports = {
  plugins: [
    require('postcss-import'),
    require('@pandacss/dev/postcss')({
      cwd: __dirname,
      configPath: path.join(__dirname, 'panda.config.ts'),
    }),
    require('autoprefixer')(),
  ],
}
