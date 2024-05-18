const {tailwindTheme} = require('@packages/design-tokens')

module.exports = {
    content: ['./src/**/*.{vue,html,js,ts,scss}'],
    theme: {
        extend: {
            ...tailwindTheme,
        },
    },
    plugins: [],
}
