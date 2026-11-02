const path = require('node:path')

module.exports = {
  plugins: [
    require('@pandacss/dev/postcss')({
      cwd: __dirname,
      configPath: path.join(__dirname, 'panda.config.ts'),
    }),
    require('tailwindcss')({
      config: path.join(__dirname, 'tailwind.config.cjs'),
    }),
    require('autoprefixer')(),
  ],
}
