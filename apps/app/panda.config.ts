import {
  pandaLayers,
  pandaTheme,
} from '../../packages/design-tokens/panda.preset'

export default {
  preflight: true,
  cssVarRoot: ':where(:root, [data-nv-theme])',
  prefix: { className: 'app' },
  layers: { ...pandaLayers, utilities: 'app_utilities' },
  globalCss: {
    html: { fontFamily: 'sans', lineHeight: '1.5' },
    '*, *::before, *::after': { userSelect: 'none', outline: '0' },
  },
  include: ['./src/**/*.{vue,ts,html}'],
  exclude: ['./src/styled-system/**'],
  outdir: 'src/styled-system',
  importMap: '@/styled-system',
  jsxFramework: 'vue',
  theme: pandaTheme,
}
