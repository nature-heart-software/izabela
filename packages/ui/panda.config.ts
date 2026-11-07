import { pandaLayers, pandaTheme } from '../design-tokens/panda.preset'
import dark from './src/themes/dark'
import light from './src/themes/light'
import { themeVariables } from './src/utils/panda'

export default {
  preflight: true,
  layers: pandaLayers,
  globalCss: {
    html: { fontFamily: 'sans', lineHeight: '1.5' },
    ':root, [data-nv-theme="dark"]': themeVariables(dark),
    '[data-nv-theme="light"]': themeVariables(light),
  },
  include: ['./src/**/*.{vue,ts}', './.storybook/**/*.{js,ts}'],
  exclude: ['./src/styled-system/**'],
  outdir: 'src/styled-system',
  importMap: '@/styled-system',
  jsxFramework: 'vue',
  theme: pandaTheme,
}
