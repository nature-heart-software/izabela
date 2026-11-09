import { pandaLayers, pandaTheme } from '../design-tokens/panda.preset'
import { resolveTheme } from './src/themes'
import { themeVariables } from './src/utils/panda'

export default {
  preflight: true,
  cssVarRoot: ':where(:root, [data-nv-theme])',
  layers: pandaLayers,
  globalCss: {
    html: { fontFamily: 'sans', lineHeight: '1.5' },
    ':root': themeVariables(resolveTheme('')),
  },
  include: ['./src/**/*.{vue,ts}', './.storybook/**/*.{js,ts}'],
  exclude: ['./src/styled-system/**'],
  outdir: 'src/styled-system',
  importMap: '@/styled-system',
  jsxFramework: 'vue',
  theme: pandaTheme,
}
