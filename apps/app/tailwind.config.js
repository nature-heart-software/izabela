const { tailwindTheme } = require('@packages/ui/dist/ui.cjs')

module.exports = {
  content: ['./src/**/*.{vue,html,js,ts,scss}'],
  theme: {
    extend: {
      ...tailwindTheme,
    },
  },
  plugins: [],
}
