/**
 * This file is auto-generated by GenerateModulesWebpackPlugin.
 * Check this file into source control.
 * Do not edit this file.
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _vite = require("vite");
var _pluginVue = _interopRequireDefault(require("@vitejs/plugin-vue"));
var _vitePluginDts = _interopRequireDefault(require("vite-plugin-dts"));
var _path = require("path");
var _vitePluginGenerateExports = require("@packages/vite-plugin-generate-exports");
var _vitePluginGenerateModules = require("@packages/vite-plugin-generate-modules");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const pkg = require('./package.json');
const packagesToOmit = ['element-plus'];
const omitPackages = keys => keys.filter(key => !packagesToOmit.includes(key));
const externalPackages = [...omitPackages(Object.keys(pkg.dependencies || {})), ...omitPackages(Object.keys(pkg.peerDependencies || {}))];
const externals = externalPackages.map(packageName => new RegExp(`^${packageName}(\/.*)?`));
const mode = (() => {
  const args = process.argv;
  const index = args.indexOf('--mode');
  return index < 0 ? 'production' : args[index + 1];
})();

// https://vitejs.dev/config/
var _default = (0, _vite.defineConfig)({
  plugins: [(0, _pluginVue.default)(), (0, _vitePluginDts.default)(), (0, _vitePluginGenerateExports.generateExportsPlugin)({
    watch: mode === 'development',
    entries: [{
      omitExtension: false,
      omitSemi: true,
      filename: 'index.ts',
      include: ['**/*.vue'],
      exclude: ['**/Icons/*'],
      directories: ['./src/components']
    }, {
      omitExtension: false,
      omitSemi: true,
      filename: 'index.ts',
      include: ['**/*.vue'],
      exclude: ['**/*Story.vue'],
      directories: ['./src/components/typography/Icons']
    }]
  }), (0, _vitePluginGenerateModules.generateModulesPlugin)({
    watch: mode === 'development',
    entries: [{
      pattern: './src/styles/tokens.ts',
      into: ['commonjs']
    }, {
      pattern: './vite.config.ts',
      into: ['commonjs']
    }]
  })],
  resolve: {
    alias: {
      '@': (0, _path.resolve)(__dirname, 'src')
    }
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: (0, _path.resolve)(__dirname, 'src/main.ts'),
      name: 'main',
      formats: ['cjs', 'es'],
      fileName: format => `main.${{
        cjs: 'cjs',
        es: 'es.js'
      }[format]}`
    },
    rollupOptions: {
      external: externals
    }
  }
});
exports.default = _default;
/* End of auto-generated content. */
