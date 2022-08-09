const { tailwindTheme } = require('@izabela/ui/dist/ui.cjs')

module.exports = {
  content: ['./src/**/*.{vue,html,js,ts,scss}'],
  theme: {
    extend: {
      ...tailwindTheme,
    },
  },
  plugins: [],
}
