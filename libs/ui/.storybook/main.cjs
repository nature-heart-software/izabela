module.exports = {
    "stories": [
        "../../src/**/*.stories.@(js|jsx|ts|tsx|mdx)",
    ],
    "addons": [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
    ],
    "framework": "@storybook/vue3",
    "core": {
        "builder": "@storybook/builder-vite",
    },
    "features": {
        "storyStoreV7": true,
    },
}
