module.exports = {
  plugins: [require('postcss-import'), require('tailwindcss')('./src/tailwind.config.js'), require('autoprefixer')],
}
