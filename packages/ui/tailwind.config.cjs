/** @type {import('tailwindcss').Config} */
const tokens = require('./src/styles/tokens.cjs').default
module.exports = {
    content: [
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            ...tokens,
        },
    },
    plugins: [],
}
