/** @type {import('tailwindcss').Config} */
const {tailwindTheme} = require('@packages/design-tokens')
module.exports = {
    content: [
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            ...tailwindTheme,
        },
    },
    plugins: [],
}
