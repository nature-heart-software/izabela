import {
  defineComponent,
  h,
  provide,
  reactive,
  watch,
  type PropType,
} from 'vue'
import { themeVariables, THEME_BOUNDARY } from '../utils/panda'

/**
 * Shares a stable, reactive theme and a scoped CSS-variable boundary.
 * @example
 * ```ts
 * h(ThemeProvider, { theme: resolveTheme('github-dark') }, () => h('main'))
 * ```
 */
export const ThemeProvider = defineComponent({
  name: 'NvThemeProvider',
  props: {
    theme: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const theme = reactive<Record<string, unknown>>({})
    watch(
      () => props.theme,
      (value) => {
        for (const key of Object.keys(theme)) {
          if (!(key in value)) delete theme[key]
        }
        Object.assign(theme, value)
      },
      { immediate: true },
    )
    provide('theme', theme)
    provide(THEME_BOUNDARY, theme)
    return () =>
      h(
        'div',
        { 'data-nv-theme': '', style: themeVariables(theme) },
        slots.default?.(),
      )
  },
})
