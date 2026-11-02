import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  ref,
  unref,
  type Component,
  type ComponentObjectPropsOptions,
} from 'vue'

/**
 * Maps a nested theme to inheritable CSS custom properties.
 * @param theme - The theme supplied by the application.
 * @returns Theme custom properties, including every component and state role.
 * @example
 * ```ts
 * themeVariables({ text: { color: '#fff' } })
 * ```
 */
export function themeVariables(theme: unknown): Record<string, string> {
  const result: Record<string, string> = {}
  function visit(value: unknown, path: string[]) {
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value))
        visit(child, [...path, key])
    } else if (typeof value === 'string' || typeof value === 'number') {
      const key = path
        .join('-')
        .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
      result[`--nv-${key}`] = String(value)
    }
  }
  visit(unref(theme), [])
  return result
}

/**
 * Adapts a static Panda recipe to Vue's existing styled-wrapper contract.
 * Native attributes remain native; visual props are consumed by the recipe.
 * @param tag - Native element or maintained behavior primitive.
 * @param propsDefinition - Runtime component props.
 * @param recipe - A statically extracted Panda recipe.
 * @returns A Vue component supporting attrs, slots and native model input.
 * @example
 * ```ts
 * const Surface = pandaComponent('div', {}, () => 'surface')
 * ```
 */
export function pandaComponent(
  tag: string | Component,
  propsDefinition: ComponentObjectPropsOptions = {},
  recipe: (props: any) => string | undefined = () => '',
) {
  return defineComponent({
    inheritAttrs: false,
    props: { as: [String, Object], ...propsDefinition },
    emits: ['update:modelValue'],
    setup(props, { attrs, slots, emit, expose }) {
      const values = props as Record<string, unknown>
      const element = ref<HTMLElement>()
      const theme = inject<unknown>('theme', undefined)
      const variables = computed(() => themeVariables(unref(theme)))
      expose({
        get input() {
          return element.value
        },
        get $el() {
          return element.value
        },
      })
      return () => {
        const native = typeof tag === 'string'
        const target = native
          ? typeof values.as === 'string' ||
            (values.as && typeof values.as === 'object')
            ? values.as
            : tag
          : tag
        const forwarded: Record<string, unknown> = native ? {} : { ...props }
        // Polymorphism belongs to this wrapper, not the DOM or behavior primitive.
        delete forwarded.as
        if (native) {
          for (const key of [
            'disabled',
            'readonly',
            'name',
            'id',
            'tabindex',
            'min',
            'max',
            'step',
            'placeholder',
            'rows',
            'cols',
            'autocomplete',
            'required',
          ]) {
            if (values[key] !== undefined) forwarded[key] = values[key]
          }
          if (target === 'button') forwarded.type = 'button'
          if (target === 'input' || target === 'textarea') {
            forwarded.value = values.modelValue
            forwarded.onInput = (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLInputElement).value,
              )
          }
        }
        return h(
          target as any,
          mergeProps(forwarded, attrs, {
            ref: element,
            class: recipe(props),
            style: variables.value,
          }),
          typeof target === 'string' ? slots.default?.() : slots,
        )
      }
    },
  })
}
