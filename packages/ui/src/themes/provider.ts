import {
  defineComponent,
  h,
  provide,
  reactive,
  watch,
  type PropType,
} from 'vue'

/** Shares a stable, reactive theme with Panda and legacy styled components. */
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
    return () => h('div', slots.default?.())
  },
})
