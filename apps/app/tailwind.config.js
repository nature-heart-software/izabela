const theme = require('./src/styles/tokens.common').tailwindTheme

module.exports = {
  content: ['./src/**/*.{vue,html,js,ts,scss}'],
  theme: {
    extend: {
      ...theme,
    },
  },
  plugins: [],
}
