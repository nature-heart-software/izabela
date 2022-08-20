const path = require('path');
const { mergeConfig } = require('vite');
const viteConfig = require('../vite.config.cjs').default;

module.exports = {
    "stories": [
        "../src/**/*.stories.@(js|jsx|ts|tsx|mdx)",
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
    async viteFinal(config) {
        return mergeConfig(config, viteConfig);
    },
}
