import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  normalizeStyle,
  ref,
  unref,
  withDirectives,
  type Component,
  type ComponentObjectPropsOptions,
  type DirectiveBinding,
  type ObjectDirective,
  type VNode,
} from 'vue'

/**
 * Marks a provider that owns inherited theme custom properties.
 * @internal
 * @example
 * ```ts
 * provide(THEME_BOUNDARY, theme)
 * ```
 */
export const THEME_BOUNDARY = Symbol('nv-theme-boundary')

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
        .replace(/[^a-z0-9_-]/g, '-')
      result[`--nv-${key}`] = String(value)
    }
  }
  visit(unref(theme), [])
  return result
}

type ThemeVariables = Record<string, string>
interface ThemeStyleBinding {
  variables: ThemeVariables
}

const appliedThemeStyles = new WeakMap<
  HTMLElement,
  { variables: ThemeVariables; style: string | null }
>()

function applyThemeVariables(
  element: HTMLElement,
  binding: DirectiveBinding<ThemeStyleBinding>,
  vnode: VNode,
) {
  const { variables: value } = binding.value
  const applied = appliedThemeStyles.get(element)
  // Highlight and slot updates run this hook too. Avoid enumerating and
  // rewriting hundreds of tokens unless the theme or native styles changed.
  if (
    applied?.variables === value &&
    applied.style === element.getAttribute('style')
  )
    return
  const rememberStyles = () =>
    appliedThemeStyles.set(element, {
      variables: value,
      style: element.getAttribute('style'),
    })
  // Directive hooks receive the final native root, including primitive styles.
  const consumerStyle = normalizeStyle(vnode.props?.style)
  const oldValue = binding.oldValue?.variables
  const owned = new Set([...Object.keys(oldValue ?? {}), ...Object.keys(value)])
  for (const key of Object.keys(oldValue ?? {})) {
    if (
      !(key in value) &&
      consumerStyle &&
      typeof consumerStyle === 'object' &&
      Object.hasOwn(consumerStyle, key)
    ) {
      owned.delete(key)
      element.style.setProperty(key, String(consumerStyle[key] ?? ''))
    }
  }
  const unsafe = /[;{}"'\\]|\/\*|!\s*important/i
  let propertySafe = Object.values(value).some((entry) => unsafe.test(entry))
  const retained: string[] = []
  for (let index = 0; index < element.style.length; index++) {
    const key = element.style.item(index)
    if (!owned.has(key)) {
      const entry = element.style.getPropertyValue(key)
      propertySafe ||= unsafe.test(entry)
      const priority = element.style.getPropertyPriority(key)
      retained.push(`${key}:${entry}${priority ? `!${priority}` : ''};`)
    }
  }
  // Retained consumer literals must not be reparsed as declarations either.
  if (propertySafe) {
    for (const key of Object.keys(oldValue ?? {}))
      if (!(key in value) && owned.has(key)) element.style.removeProperty(key)
    for (const [key, entry] of Object.entries(value))
      element.style.setProperty(key, entry)
    rememberStyles()
    return
  }
  // Apply after primitive fallthrough: Vue otherwise expands style strings back
  // into hundreds of individual property writes on every primitive update.
  element.style.cssText =
    retained.join('') +
    Object.entries(value)
      .map(([key, entry]) => `${key}:${entry};`)
      .join('')
  rememberStyles()
}

const themeVariableDirective: ObjectDirective<HTMLElement, ThemeStyleBinding> =
  {
    mounted: applyThemeVariables,
    updated: applyThemeVariables,
    getSSRProps: ({ value }) => ({ style: value.variables }),
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
  recipe: ((props: any) => string | undefined) & {
    variantKeys?: string[]
  } = () => '',
) {
  return defineComponent({
    inheritAttrs: false,
    props: { as: [String, Object], ...propsDefinition },
    emits: ['update:modelValue'],
    setup(props, { attrs, slots, emit, expose }) {
      const values = props as Record<string, unknown>
      const element = ref<HTMLElement>()
      const theme = inject<unknown>('theme', undefined)
      // Vue injection survives Teleport; DOM custom-property inheritance does not.
      const variables = computed(() => themeVariables(unref(theme)))
      // Panda memoizes recipes by serializing their arguments. Only styling
      // variants belong in that key, never an entire voice catalog or model.
      const className = computed(() =>
        recipe(
          recipe.variantKeys
            ? Object.fromEntries(
                recipe.variantKeys.map((key) => [key, values[key]]),
              )
            : props,
        ),
      )
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
        const merged = mergeProps(forwarded, attrs, {
          ref: element,
          class: className.value,
          ...(theme === undefined ? {} : { 'data-nv-theme': '' }),
        })
        const rendered = h(
          target as any,
          merged,
          typeof target === 'string' ? slots.default?.() : slots,
        )
        return theme === undefined
          ? rendered
          : withDirectives(rendered, [
              [themeVariableDirective, { variables: variables.value }],
            ])
      }
    },
  })
}
