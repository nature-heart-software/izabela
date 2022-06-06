const theme = require('./src/styles/tokens.common').tailwindTheme

module.exports = {
  content: ['./src/**/*.{vue,html,js,scss}'],
  theme: {
    extend: {
      ...theme,
    },
  },
  plugins: [],
}
