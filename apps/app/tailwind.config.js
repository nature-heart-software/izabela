const theme = require('./src/styles/tokens.common').default

module.exports = {
  content: ['./src/**/*.{vue,html,js,scss}'],
  theme: {
    extend: {
      ...theme,
    },
  },
  plugins: [],
}
