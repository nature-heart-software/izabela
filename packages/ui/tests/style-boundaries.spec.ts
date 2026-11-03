// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, markRaw, withDirectives } from 'vue'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testRoot = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(testRoot, '..')
const outputRoot = resolve(testRoot, '../../../coverage/ui-style-boundaries')
const require = createRequire(import.meta.url)
const pandaRequire = createRequire(
  require.resolve('@pandacss/dev/package.json'),
)
const pandaCli = join(
  dirname(pandaRequire.resolve('@pandacss/dev/package.json')),
  'bin.js',
)
mkdirSync(outputRoot, { recursive: true })
// Generate from the real package config, not a test-only importMap or stale dist.
execFileSync(process.execPath, [pandaCli, 'codegen'], {
  cwd: packageRoot,
  stdio: 'pipe',
})
execFileSync(
  process.execPath,
  [pandaCli, 'cssgen', '--outfile', join(outputRoot, 'styles.css')],
  {
    cwd: packageRoot,
    stdio: 'pipe',
  },
)
const entry = `
export { GlobalStyles } from '@/main'
export { loadingDirective } from '@/loading'
export { pandaComponent } from '@/utils/panda'
export { card } from '@/components/display/Card/card.panda'
export { divider } from '@/components/miscellaneous/Divider/divider.panda'
export { table } from '@/components/display/Table/table.panda'
export { tooltipPositioner } from '@/components/overlay/Tooltip/tooltip.panda'
export { StSelectGroupLabel } from '@/components/forms/Select/select.panda'
export { default as NvButton } from '@/components/forms/Button/NvButton.vue'
export { default as NvTextarea } from '@/components/forms/Textarea/NvTextarea.vue'
export { default as NvRangeInput } from '@/components/forms/RangeInput/NvRangeInput.vue'
export { default as NvInput } from '@/components/forms/Input/NvInput.vue'
export { default as NvNumberInput } from '@/components/forms/NumberInput/NvNumberInput.vue'
export { themes } from '@/themes'
export { Popover, Dialog, Menu, Tooltip } from '@ark-ui/vue'
`
// The real SFC graph needs the library alias. Keep it in this local build, not
// workspace Vitest config; run esbuild in Node rather than jsdom's typed arrays.
execFileSync(
  process.execPath,
  [
    '--input-type=module',
    '-e',
    `
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { win32 } from 'node:path'
await build({
  root: ${JSON.stringify(
    packageRoot,
  )}, configFile: false, envFile: false, logLevel: 'error',
  plugins: [vue(), {
    name: 'style-boundaries-entry',
    resolveId(id) { if (win32.basename(id) === 'style-boundaries-client') return 'style-boundaries-client' },
    load(id) { if (id === 'style-boundaries-client') return ${JSON.stringify(
      entry,
    )} },
  }],
  resolve: { alias: ${JSON.stringify({
    '@': resolve(packageRoot, 'src'),
    '@packages/design-tokens': resolve(
      packageRoot,
      '../design-tokens/src/main.ts',
    ),
    '@packages/icons': resolve(packageRoot, '../icons/src/main.ts'),
  })} },
  build: {
    outDir: ${JSON.stringify(outputRoot)}, emptyOutDir: false, minify: false,
    lib: { entry: 'style-boundaries-client', formats: ['es'], fileName: () => 'client.js' },
    rollupOptions: { external: (id) => id === 'vue' || id.startsWith('vue/') },
  },
})
`,
  ],
  { stdio: 'pipe' },
)
const clientPath = '../../../coverage/ui-style-boundaries/client.js'
const ui = await import(/* @vite-ignore */ clientPath)
const css = readFileSync(join(outputRoot, 'styles.css'), 'utf8')
const postcss = pandaRequire('postcss')
const parseSelector = pandaRequire('postcss-selector-parser')
const rules: {
  selector: string
  classes: string[]
  declarations: Record<string, string>
  media: string
}[] = []
postcss.parse(css).walkRules((rule: any) => {
  const classes: string[] = []
  parseSelector((selectors: any) =>
    selectors.walkClasses((node: any) => classes.push(node.value)),
  ).processSync(rule.selector)
  const declarations: Record<string, string> = {}
  rule.walkDecls((decl: any) => {
    declarations[decl.prop] = decl.value
  })
  rules.push({
    selector: rule.selector,
    classes,
    declarations,
    media: rule.parent.type === 'atrule' ? rule.parent.params : '',
  })
})
const wrappers: VueWrapper[] = []
function render(component: any, options: any = {}) {
  const wrapper = mount(component, { attachTo: document.body, ...options })
  wrappers.push(wrapper)
  return wrapper
}
function emittedRules(classes: string[]) {
  return rules.filter((rule) =>
    rule.classes.some((name) => classes.includes(name)),
  )
}
function expectExtracted(classes: string[]) {
  expect(classes.length).toBeGreaterThan(0)
  expect(
    classes.filter(
      (name) => !rules.some((rule) => rule.classes.includes(name)),
    ),
  ).toEqual([])
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('Ark as-child button appearance', () => {
  it('extracts the tooltip opacity fade without adding movement', () => {
    const extracted = emittedRules(ui.tooltipPositioner().split(' '))
    expect(extracted.map((rule) => rule.declarations)).toContainEqual({
      'animation-name': 'nv-tooltip-in',
    })
    expect(extracted.map((rule) => rule.declarations)).toContainEqual({
      'animation-duration': 'var(--nv-tooltip-enter-duration, 300ms)',
    })
    expect(css).toContain('@keyframes nv-tooltip-in')
    const animatedProperties: string[] = []
    postcss.parse(css).walkAtRules('keyframes', (rule: any) => {
      if (rule.params === 'nv-tooltip-in')
        rule.walkDecls((decl: any) => animatedProperties.push(decl.prop))
    })
    expect(animatedProperties).toEqual(['opacity', 'opacity'])
  })

  it.each(['xs', 'sm', 'md', 'lg'])(
    'keeps %s icon-only buttons free of size padding',
    (size) => {
      const wrapper = render(ui.NvButton, {
        props: { size, iconName: 'github' },
      })
      const declarations = emittedRules(wrapper.classes()).map(
        (rule) => rule.declarations,
      )
      expect(declarations).toContainEqual({
        'padding-inline': 'var(--spacing-0)',
      })
      expect(
        declarations.some(
          (rule) =>
            rule['padding-inline'] &&
            rule['padding-inline'] !== 'var(--spacing-0)',
        ),
      ).toBe(false)
      expect(wrapper.find('svg').exists()).toBe(true)
    },
  )

  it.each(
    ['Popover', 'Menu', 'Dialog', 'Tooltip'].flatMap((kind) =>
      [undefined, 'plain', 'ghost'].map((appearance) => [kind, appearance]),
    ),
  )(
    '%s keeps %s visual button type separate from native type',
    (kind, appearance) => {
      const primitive = ui[kind!]
      const wrapper = render(primitive.Root, {
        slots: {
          default: () =>
            h(
              primitive.Trigger,
              { asChild: true },
              {
                default: () =>
                  h(
                    ui.NvButton,
                    appearance ? { type: appearance } : {},
                    () => 'Open',
                  ),
              },
            ),
        },
      })
      const button = wrapper.get('button')
      const role = appearance || 'default'
      expect(button.attributes('type')).toBe('button')
      expect(button.classes()).toContain(
        `bg-c_var(--nv-button-${role}-background-color)`,
      )
      expect(button.classes()).toContain(`c_var(--nv-button-${role}-color)`)
      expect(button.classes()).toContain(
        `bd-c_var(--nv-button-${role}-border-color)`,
      )
      expect(
        emittedRules(button.classes()).map((rule) => rule.declarations),
      ).toContainEqual({
        'background-color': `var(--nv-button-${role}-background-color)`,
      })
    },
  )
})

describe('wrapper-owned polymorphism', () => {
  it.each([
    ['Textarea', 'textarea', 'before', 'after'],
    ['RangeInput', 'input', 2, 4],
    ['Input', 'input', 'before', 'after'],
    ['NumberInput', 'input', '2', '4'],
  ])(
    'preserves current %s model payloads, native attrs and exposed input refs',
    async (name, selector, before, after) => {
      const wrapper = render(ui[`Nv${name}`], {
        props: { modelValue: before },
        attrs: { 'aria-label': 'Value', name: 'value', min: 0, max: 10 },
      })
      const input = wrapper.get(selector)
      expect((input.element as HTMLInputElement).value).toBe(String(before))
      expect(input.attributes('aria-label')).toBe('Value')
      expect(input.attributes('name')).toBe('value')
      expect(input.attributes('as')).toBeUndefined()
      expect(input.attributes('modelvalue')).toBeUndefined()
      expect(input.attributes('size')).toBeUndefined()
      if (name !== 'RangeInput')
        expect((wrapper.vm as any).input).toBe(input.element)
      await input.setValue(after)
      expect(wrapper.emitted('update:modelValue')).toEqual([[after]])
      await wrapper.setProps({ modelValue: name === 'RangeInput' ? 7 : '7' })
      expect((input.element as HTMLInputElement).value).toBe('7')
    },
  )

  it('consumes implicit as on a wrapper with no as prop and keeps anchor attrs, slots, classes and refs', async () => {
    const Surface = ui.pandaComponent(
      'button',
      { size: { default: 'md' } },
      () => 'surface-recipe',
    )
    const wrapper = render(Surface, {
      attrs: { as: 'a', href: '#target', class: 'consumer' },
      slots: { default: 'Continue' },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('#target')
    expect(wrapper.attributes('as')).toBeUndefined()
    expect(wrapper.attributes('size')).toBeUndefined()
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.classes().sort()).toEqual(['consumer', 'surface-recipe'])
    expect(wrapper.text()).toBe('Continue')
    expect((wrapper.vm as any).input).toBe(wrapper.element)
    await wrapper.setProps({ as: 'button' })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect((wrapper.vm as any).input).toBe(wrapper.element)
  })

  it('preserves the implicit as API through the current Button SFC', () => {
    const wrapper = render(ui.NvButton, {
      attrs: { as: 'a', href: '#target' },
      slots: { default: 'Continue' },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('#target')
    expect(wrapper.attributes('as')).toBeUndefined()
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('preserves native-wrapper component overrides without leaking styling props', () => {
    const Link = defineComponent({
      setup:
        (_, { attrs, slots }) =>
        () =>
          h('a', attrs, slots.default?.()),
    })
    const Surface = ui.pandaComponent(
      'button',
      { size: { default: 'md' } },
      () => 'surface-recipe',
    )
    const wrapper = render(Surface, {
      props: { as: markRaw(Link) },
      attrs: { href: '#component' },
      slots: { default: 'Link' },
    })
    const anchor = wrapper.get('a')
    expect(anchor.attributes('href')).toBe('#component')
    expect(anchor.attributes('as')).toBeUndefined()
    expect(anchor.attributes('size')).toBeUndefined()
    expect(anchor.attributes('type')).toBeUndefined()
    expect(anchor.classes()).toContain('surface-recipe')
    expect(anchor.text()).toBe('Link')
  })

  it('does not replace maintained behavior primitives with a native as tag or leak as', () => {
    const Primitive = defineComponent({
      props: { name: String },
      setup:
        (props, { attrs, slots }) =>
        () =>
          h('button', { ...attrs, name: props.name }, slots.default?.()),
    })
    const Surface = ui.pandaComponent(
      Primitive,
      { name: String },
      () => 'primitive-recipe',
    )
    const wrapper = render(Surface, {
      props: { as: 'a', name: 'action' },
      slots: { default: 'Action' },
    })
    const button = wrapper.get('button')
    expect(button.attributes('name')).toBe('action')
    expect(wrapper.find('a').exists()).toBe(false)
    expect(button.attributes('as')).toBeUndefined()
  })
})

describe('generated style boundaries', () => {
  it('uses the legacy disabled-item backdrop theme roles without changing pending host behavior', async () => {
    const Host = defineComponent({
      props: { busy: Boolean },
      setup: (props) => () =>
        h(ui.GlobalStyles, null, {
          default: () =>
            withDirectives(h('button', { 'aria-busy': 'false' }, 'Save'), [
              [ui.loadingDirective, props.busy],
            ]),
        }),
    })
    const wrapper = render(Host, {
      props: { busy: true },
      global: {
        provide: {
          theme: {
            disabledItemBackground: {
              backdropColor: '#123456',
              backdropOpacity: 0.25,
            },
          },
        },
      },
    })
    const button = wrapper.get('button')
    const mask = wrapper.get('[role="status"]')
    expect(
      emittedRules(mask.classes()).map((rule) => rule.declarations),
    ).toContainEqual({
      'background-color':
        'color-mix(in srgb, var(--nv-disabled-item-background-backdrop-color) calc(var(--nv-disabled-item-background-backdrop-opacity) * 100%), transparent)',
    })
    expect(
      (wrapper.element as HTMLElement).style.getPropertyValue(
        '--nv-disabled-item-background-backdrop-color',
      ),
    ).toBe('#123456')
    expect(
      (wrapper.element as HTMLElement).style.getPropertyValue(
        '--nv-disabled-item-background-backdrop-opacity',
      ),
    ).toBe('0.25')
    expect(button.attributes('aria-busy')).toBe('true')
    expect((button.element as HTMLButtonElement).disabled).toBe(false)
    expect(button.attributes('disabled')).toBeUndefined()
    await wrapper.setProps({ busy: false })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(button.attributes('aria-busy')).toBe('false')
  })

  it('emits valid legacy-equivalent Card radius and shadow declarations', () => {
    const declarations = emittedRules(
      ui.card({ size: 'md', variant: 'default' }).split(' '),
    ).map((rule) => rule.declarations)
    expect(declarations).toContainEqual({ 'border-radius': 'var(--radii-md)' })
    expect(declarations).toContainEqual({ 'box-shadow': 'var(--shadows-lg)' })
    expect(css).toContain('--radii-md: 0.5rem;')
    expect(css).toContain(
      '--shadows-lg: 0 0.125rem 0.063rem rgba(0, 0, 0, 0.05);',
    )
  })

  it.each([
    ['vertical', 'border-right-width'],
    ['horizontal', 'border-top-width'],
  ])('emits a valid thin %s Divider border', (direction, property) => {
    const declarations = emittedRules(ui.divider({ direction }).split(' ')).map(
      (rule) => rule.declarations,
    )
    expect(declarations).toContainEqual({
      [property]: 'var(--border-widths-thin)',
    })
    expect(css).toContain('--border-widths-thin: 1px;')
  })

  it('emits a resolved thin border token for native table cells', () => {
    const declarations = emittedRules(ui.table().split(' ')).map(
      (rule) => rule.declarations,
    )
    expect(declarations).toContainEqual({
      'border-bottom':
        'var(--border-widths-thin) solid var(--nv-table-border-color, var(--nv-divider-border-color))',
    })
  })

  it('emits valid legacy-equivalent shadows on both global tour surfaces', () => {
    const wrapper = render(ui.GlobalStyles)
    for (const selector of [' #vjt-tooltip', ' #vjt-arrow::before']) {
      expect(
        emittedRules(wrapper.classes())
          .filter((rule) => rule.selector.includes(selector))
          .map((rule) => rule.declarations),
      ).toContainEqual({ 'box-shadow': 'var(--shadows-lg)' })
    }
  })

  it('extracts every runtime GlobalStyles class and its scrollbar and tour selectors', () => {
    const wrapper = render(ui.GlobalStyles)
    expectExtracted(wrapper.classes())
    const selectors = emittedRules(wrapper.classes())
      .map((rule) => rule.selector)
      .join('\n')
    expect(selectors).toContain('::-webkit-scrollbar-thumb')
    expect(selectors).toContain('#vjt-tooltip')
    expect(selectors).toContain('#vjt-arrow::before')
    expect(selectors).toContain('.vjt-highlight')
  })

  it('attaches scrollbar hover and active states to each thumb', () => {
    const wrapper = render(ui.GlobalStyles)
    const thumbRules = emittedRules(wrapper.classes()).filter((rule) =>
      rule.selector.includes('::-webkit-scrollbar-thumb'),
    )
    for (const state of ['hover', 'active']) {
      const stateRules = thumbRules.filter(
        (rule) =>
          rule.declarations['background-color'] ===
          `var(--nv-button-plain-${state}-background-color)`,
      )
      expect(stateRules).toHaveLength(1)
      expect(stateRules[0].selector).toMatch(
        new RegExp(`::\\-webkit-scrollbar-thumb:${state}$`),
      )
    }
  })

  it('draws a themed divider behind group labels without an option highlight', () => {
    const wrapper = render(ui.StSelectGroupLabel, {
      global: { provide: { theme: ui.themes.get('dark') } },
      slots: { default: () => h('span', 'Voices') },
    })
    const labelRules = emittedRules(wrapper.classes())
    expect(labelRules).toContainEqual(
      expect.objectContaining({
        declarations: { color: 'var(--nv-select-option-readonly-color)' },
      }),
    )
    const lineRules = labelRules.filter((rule) =>
      rule.selector.includes('::before'),
    )
    expect(
      Object.assign({}, ...lineRules.map((rule) => rule.declarations)),
    ).toMatchObject({
      content: "''",
      position: 'absolute',
      top: '50%',
      height: '1px',
      width: '100%',
      'background-color': 'var(--nv-select-option-readonly-border-color)',
    })
    expect(
      wrapper.element.style.getPropertyValue(
        '--nv-select-option-readonly-border-color',
      ),
    ).toBeTruthy()
    expect(labelRules.some((rule) => rule.selector.includes(':hover'))).toBe(
      false,
    )
  })

  it('extracts actual directive mask and spinner classes including reduced motion', () => {
    const Host = defineComponent({
      setup: () => () =>
        withDirectives(h('button', 'Save'), [[ui.loadingDirective, true]]),
    })
    const wrapper = render(Host)
    const mask = wrapper.get('[role="status"]')
    const spinner = mask.get('[aria-hidden="true"]')
    expectExtracted(wrapper.classes())
    expectExtracted(mask.classes().filter((name) => name !== 'nv-loading-mask'))
    expectExtracted(spinner.classes())
    const declarations = emittedRules(spinner.classes()).map(
      (rule) => rule.declarations,
    )
    expect(declarations).toContainEqual(
      expect.objectContaining({ width: '1rem' }),
    )
    expect(declarations).toContainEqual(
      expect.objectContaining({ height: '1rem' }),
    )
    expect(declarations).toContainEqual(
      expect.objectContaining({ border: '2px solid currentColor' }),
    )
    expect(declarations).toContainEqual(
      expect.objectContaining({ animation: 'spin 0.8s linear infinite' }),
    )
    expect(emittedRules(spinner.classes())).toContainEqual(
      expect.objectContaining({
        media: '(prefers-reduced-motion: reduce)',
        declarations: { animation: 'none' },
      }),
    )
    expect(css).toContain('@keyframes spin')
  })
})
