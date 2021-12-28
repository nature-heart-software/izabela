const theme = require('./src/theme.ts')

module.exports = {
  content: ['./src/**/*.{vue,html,js,scss}'],
  theme: {
    extend: {
      ...theme,
    },
  },
  plugins: [],
}
