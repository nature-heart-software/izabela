// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
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
export { default as NvText } from '@/components/typography/Text/NvText.vue'
export { default as NvAlert } from '@/components/feedback/Alert/NvAlert.vue'
export { default as NvTable } from '@/components/display/Table/NvTable.vue'
export { default as NvTableColumn } from '@/components/display/Table/NvTableColumn.vue'
export { tooltipPositioner, StTooltipContent } from '@/components/overlay/Tooltip/tooltip.panda'
export { StSelectGroupLabel } from '@/components/forms/Select/select.panda'
export { default as NvButton } from '@/components/forms/Button/NvButton.vue'
export { default as NvTextarea } from '@/components/forms/Textarea/NvTextarea.vue'
export { default as NvRangeInput } from '@/components/forms/RangeInput/NvRangeInput.vue'
export { default as NvSwitch } from '@/components/forms/Switch/NvSwitch.vue'
export { default as NvInput } from '@/components/forms/Input/NvInput.vue'
export { default as NvNumberInput } from '@/components/forms/NumberInput/NvNumberInput.vue'
export { themes } from '@/themes'
export { default as NvPopover } from '@/components/overlay/Popover/NvPopover.vue'
export { default as NvSelect } from '@/components/forms/Select/NvSelect.vue'
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

describe('toggle hover background cascade', () => {
  it.each(['kumo-ink-light', 'kumo-ink-dark', 'github-light', 'github-dark'])(
    'matches button hover backgrounds before and after focus in %s',
    (themeId) => {
      const theme = ui.themes.get(themeId)
      const variables: Record<string, string> = {}
      const visit = (value: any, path: string[] = []) => {
        for (const [key, child] of Object.entries(value)) {
          if (child && typeof child === 'object') visit(child, [...path, key])
          else variables[`--colors-${[...path, key].join('-')}`] = String(child)
        }
      }
      visit(theme)
      const background = (element: HTMLElement) => {
        const candidates = emittedRules([...element.classList])
          .filter(
            (rule) =>
              rule.declarations['background-color'] &&
              element.matches(rule.selector),
          )
          .map((rule, order) => {
            let specificity = 0
            parseSelector((selectors: any) =>
              selectors.walk((node: any) => {
                if (node.type === 'id') specificity += 100
                if (node.type === 'class' || node.type === 'attribute')
                  specificity += 10
                if (node.type === 'tag') specificity += 1
              }),
            ).processSync(rule.selector)
            return { rule, specificity, order }
          })
          .sort((a, b) => a.specificity - b.specificity || a.order - b.order)
        const value = candidates.at(-1)?.rule.declarations['background-color']
        expect(value).toBeDefined()
        return value!.replace(
          /var\((--colors-[^)]+)\)/g,
          (_, name) => variables[name],
        )
      }
      for (const checked of [false, true]) {
        const wrapper = render(ui.NvSwitch, {
          props: { modelValue: checked },
          global: { provide: { theme } },
        })
        const control = wrapper.get('[data-part="control"]')
          .element as HTMLElement
        const thumb = wrapper.get('[data-part="thumb"]').element as HTMLElement
        for (const node of [control, thumb]) node.setAttribute('data-hover', '')
        for (const focused of [false, true]) {
          for (const node of [control, thumb])
            node.toggleAttribute('data-focus', focused)
          expect(
            background(control),
            `checked=${checked}, focused=${focused}`,
          ).toBe(theme.button.default.hover.background)
          expect(background(thumb)).not.toBe(background(control))
        }
      }
    },
  )
})

describe('Ark as-child button appearance', () => {
  it.each(['default', 'plain', 'ghost', 'ghost-alt', 'active'])(
    'uses a pointer cursor on enabled %s buttons',
    (type) => {
      const wrapper = render(ui.NvButton, {
        props: { type },
        slots: { default: 'Action' },
      })
      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(
        emittedRules(wrapper.classes()).map((rule) => rule.declarations),
      ).toContainEqual({ cursor: 'pointer' })
    },
  )

  it.each(['default', 'plain', 'ghost', 'ghost-alt', 'active'])(
    'keeps disabled %s buttons unavailable rather than showing a pointer',
    (type) => {
      let clicks = 0
      const wrapper = render(ui.NvButton, {
        props: { type },
        attrs: { disabled: true, onClick: () => clicks++ },
        slots: { default: 'Unavailable' },
      })
      const button = wrapper.element as HTMLButtonElement
      expect(button.disabled).toBe(true)
      button.click()
      expect(clicks).toBe(0)
      expect(
        emittedRules(wrapper.classes())
          .filter((rule) => rule.selector.includes(':disabled'))
          .map((rule) => rule.declarations),
      ).toContainEqual({ cursor: 'not-allowed' })
    },
  )

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
      expect(button.classes()).toContain(`bg-c_button.${role}.background`)
      expect(button.classes()).toContain(`c_button.${role}.text`)
      expect(button.classes()).toContain(`bd-c_button.${role}.border`)
      expect(
        emittedRules(button.classes()).map((rule) => rule.declarations),
      ).toContainEqual({
        'background-color': `var(--colors-button-${role}-background)`,
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

// Resolve the emitted utility cascade on real mounted markup. These probes are
// deliberately limited to normal utility declarations in the same Panda layer.
function winningRole(element: Element, property: string, pseudo = '') {
  const candidates: { value: string; weight: number; order: number }[] = []
  function weight(node: any): number {
    if (node.type === 'id') return 10000
    if (node.type === 'class' || node.type === 'attribute') return 100
    if (node.type === 'tag') return 1
    if (node.type === 'pseudo') {
      if (node.value === ':where') return 0
      if ([':is', ':not', ':has'].includes(node.value))
        return Math.max(...node.nodes.map(weight))
      return node.value.startsWith('::') ? 1 : 100
    }
    return (
      node.nodes?.reduce((sum: number, child: any) => sum + weight(child), 0) ??
      0
    )
  }
  rules.forEach((rule, order) => {
    if (!rule.classes.length) return
    const value =
      rule.declarations[property] ??
      (property === 'border-bottom-color'
        ? rule.declarations['border-color'] ??
          rule.declarations['border-bottom']?.match(
            /var\(--colors-[^)]+\)/,
          )?.[0]
        : undefined)
    if (!value) return
    parseSelector((selectors: any) =>
      selectors.each((selector: any) => {
        const text = selector.toString()
        if (pseudo ? !text.endsWith(pseudo) : text.includes('::')) return
        if (element.matches(pseudo ? text.slice(0, -pseudo.length) : text))
          candidates.push({ value, weight: weight(selector), order })
      }),
    ).processSync(rule.selector)
  })
  return candidates
    .sort((a, b) => a.weight - b.weight || a.order - b.order)
    .at(-1)?.value
}

describe('Select search surface ownership', () => {
  it('matches the transition timing of Buttons and Inputs', () => {
    const select = render(ui.NvSelect)
    const button = render(ui.NvButton)
    const input = render(ui.NvInput)
    const transition = winningRole(button.get('button').element, 'transition')
    expect(transition).toBe('all .3s')
    expect(winningRole(input.get('input').element, 'transition')).toBe(
      transition,
    )
    expect(
      winningRole(select.get('[data-nv-select-control]').element, 'transition'),
    ).toBe(transition)
  })

  it.each(['sm', 'md', 'lg'])(
    'keeps the %s multi-select search input transparent at rest and focus',
    async (size) => {
      const wrapper = render(ui.NvSelect, {
        props: {
          size,
          multiple: true,
          modelValue: ['speakers'],
          options: [
            { value: 'speakers', label: 'Speakers' },
            { value: 'headphones', label: 'Headphones' },
          ],
        },
      })
      expect(
        rules.some(
          (rule) =>
            rule.declarations['--colors-transparent'] === 'rgb(0 0 0 / 0)',
        ),
      ).toBe(true)
      const input = wrapper.get('input')
      expect(winningRole(input.element, 'background-color')).toBe(
        'var(--colors-transparent)',
      )
      await input.trigger('focus')
      expect(winningRole(input.element, 'background-color')).toBe(
        'var(--colors-transparent)',
      )
      expect(
        wrapper.get('[data-nv-select-control]').classes().length,
      ).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('Speakers')
    },
  )
})

describe('Button cursor affordance', () => {
  it.each(['default', 'plain', 'ghost', 'ghost-alt', 'active'])(
    'uses a pointer for enabled %s buttons',
    (type) => {
      const wrapper = render(ui.NvButton, {
        props: { type },
        slots: { default: 'Run' },
      })
      expect(winningRole(wrapper.get('button').element, 'cursor')).toBe(
        'pointer',
      )
    },
  )

  it('keeps disabled buttons non-interactive with a not-allowed cursor', () => {
    const wrapper = render(ui.NvButton, {
      attrs: { disabled: true },
      slots: { default: 'Unavailable' },
    })
    const button = wrapper.get('button')
    expect((button.element as HTMLButtonElement).disabled).toBe(true)
    expect(winningRole(button.element, 'cursor')).toBe('not-allowed')
  })
})

describe('canonical role cascade', () => {
  it.each(['caption', 'label', 'body-small', 'body', 'subtitle', 'title'])(
    'lets the %s Text underline role own its pseudo-element',
    (type) => {
      const wrapper = render(ui.NvText, {
        props: { type },
        slots: { default: () => h('a', { href: '#' }, 'Link') },
      })
      expect(
        winningRole(wrapper.get('a').element, 'background-color', '::before'),
      ).toBe(`var(--colors-text-${type}-link-underline)`)
    },
  )
  it.each(['info', 'success', 'warning', 'error'])(
    'lets the %s Alert underline role override its composed NvText',
    (type) => {
      const wrapper = render(ui.NvAlert, {
        props: { type },
        slots: { default: () => h('a', { href: '#' }, 'Link') },
      })
      expect(
        winningRole(wrapper.get('a').element, 'background-color', '::before'),
      ).toBe(`var(--colors-alert-${type}-link-underline)`)
    },
  )
  it.each([undefined, 'left', 'right'])(
    'lets the %s column own both native cell border colors',
    (fixed) => {
      const wrapper = render(ui.NvTable, {
        props: { data: [{ value: 'Cell' }] },
        slots: {
          default: () =>
            h(ui.NvTableColumn, { prop: 'value', label: 'Header', fixed }),
        },
      })
      for (const cell of wrapper.findAll('th, td'))
        expect(winningRole(cell.element, 'border-bottom-color')).toBe(
          fixed
            ? 'var(--colors-table-frozen-border)'
            : 'var(--colors-table-column-default-border)',
        )
    },
  )
})

describe('generated style boundaries', () => {
  it.each(
    [...ui.themes.keys()].flatMap((themeId) =>
      ['sm', 'md', 'lg'].map((size) => [themeId, size]),
    ),
  )(
    'keeps nested shields undecorated and the owned Card themed (%s, %s)',
    async (themeId, size) => {
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe() {}
          unobserve() {}
          disconnect() {}
        },
      )
      const geometry = vi
        .spyOn(HTMLElement.prototype, 'getClientRects')
        .mockReturnValue([
          {
            width: 300,
            height: 100,
            top: 0,
            left: 0,
            right: 300,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON() {},
          },
        ] as any)
      try {
        const wrapper = render(ui.NvPopover, {
          props: { size },
          global: {
            provide: { theme: ui.themes.get(themeId) },
            stubs: { transition: false },
          },
          slots: {
            reference: () => h('button', 'Open'),
            default: () =>
              h(ui.NvSelect, {
                options: [{ label: 'Alpha', value: 'a' }],
                modelValue: 'a',
              }),
          },
        })
        await wrapper.get('button').trigger('click')
        await flushPromises()
        await new Promise((resolve) => setTimeout(resolve, 50))
        const content = document.querySelector(
          '[data-scope="popover"][data-part="content"]',
        )!
        const input = content.querySelector('input')!
        input.focus()
        await flushPromises()
        await new Promise((resolve) => setTimeout(resolve, 50))
        const shield = content.querySelector('[data-nv-overlay-shield]')!
        expect(shield).not.toBeNull()
        expect(shield.parentElement).toBe(content)
        for (const boundary of [
          shield,
          document.querySelector('[data-overlay-shield="popover"]')!,
        ]) {
          expect(boundary).not.toBeNull()
          expect(winningRole(boundary, 'background-color')).toBeUndefined()
          expect(winningRole(boundary, 'background-image')).toBeUndefined()
          expect(winningRole(boundary, 'box-shadow')).toBeUndefined()
        }
        const card = Array.from(content.children).find((child) =>
          child.hasAttribute('data-nv-popover-surface'),
        )!
        expect(card, content.innerHTML).toBeTruthy()
        expect(winningRole(card, 'background-color')).toBe(
          `var(--colors-popover-${size}-background)`,
        )
        expect(winningRole(card, 'box-shadow')).toBe(
          `var(--shadows-popover-${size}-shadow)`,
        )
        expect(
          (card as HTMLElement).style.getPropertyValue(
            `--nv-popover-${size}-background`,
          ),
        ).toBe(ui.themes.get(themeId).popover[size].background)
        expect(
          (card as HTMLElement).style.getPropertyValue(
            `--nv-popover-${size}-shadow`,
          ),
        ).toBe(ui.themes.get(themeId).popover[size].shadow)
      } finally {
        geometry.mockRestore()
        vi.unstubAllGlobals()
      }
    },
  )

  it('uses loading-owned pending roles without changing native host behavior', async () => {
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
            loading: {
              default: {
                pending: {
                  background: 'rgba(18, 52, 86, 0.25)',
                  foreground: '#123456',
                  spinner: '#abcdef',
                },
              },
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
      'background-color': 'var(--colors-loading-default-pending-background)',
    })
    expect(
      (wrapper.element as HTMLElement).style.getPropertyValue(
        '--nv-loading-default-pending-foreground',
      ),
    ).toBe('#123456')
    expect(
      (wrapper.element as HTMLElement).style.getPropertyValue(
        '--nv-loading-default-pending-background',
      ),
    ).toBe('rgba(18, 52, 86, 0.25)')
    expect(button.attributes('aria-busy')).toBe('true')
    expect((button.element as HTMLButtonElement).disabled).toBe(false)
    expect(button.attributes('disabled')).toBeUndefined()
    await wrapper.setProps({ busy: false })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(button.attributes('aria-busy')).toBe('false')
  })

  it('emits canonical Card radius and shadow declarations', () => {
    const declarations = emittedRules(
      ui.card({ size: 'md', variant: 'default' }).split(' '),
    ).map((rule) => rule.declarations)
    expect(declarations).toContainEqual({ 'border-radius': 'var(--radii-md)' })
    expect(declarations).toContainEqual({
      'box-shadow': 'var(--shadows-card-default-shadow)',
    })
    expect(css).toContain('--radii-md: 0.5rem;')
    expect(css).toContain('--shadows-card-default-shadow:')
  })

  it.each([
    ['vertical', 'border-right-width'],
    ['horizontal', 'border-top-width'],
  ])('emits a valid thin %s Divider border', (direction, property) => {
    const declarations = emittedRules(ui.divider({ direction }).split(' ')).map(
      (rule) => rule.declarations,
    )
    expect(declarations).toContainEqual({
      [property]: 'var(--border-widths-default)',
    })
    expect(css).toContain('--border-widths-default: 1px;')
  })

  it('emits a resolved thin border token for native table cells', () => {
    const declarations = emittedRules(ui.table().split(' ')).map(
      (rule) => rule.declarations,
    )
    expect(declarations).toContainEqual({
      'border-bottom-width': 'var(--border-widths-default)',
    })
    expect(declarations).toContainEqual({ 'border-bottom-style': 'solid' })
  })

  it.each([...ui.themes.keys()])(
    'emits inverse-themed Tour colors without recoloring Tooltip (%s)',
    (themeId) => {
      const theme = ui.themes.get(themeId)
      expect(theme.tourGuide?.default).toEqual({
        background: theme.tooltip.default.background,
        text: theme.tooltip.default.text,
        shadow: theme.tooltip.default.shadow,
        'action-focus': { ring: theme.tooltip.default.text },
      })
      const wrapper = render(ui.GlobalStyles, {
        global: { provide: { theme } },
        slots: {
          default: () => [
            h('div', { id: 'vjt-tooltip' }, [
              h(ui.NvText, { 'data-nv-tour-content': '' }, () => 'Tour body'),
              h('div', { id: 'vjt-arrow' }),
              ...['Previous', 'Next', 'Close'].map((label) =>
                h(
                  ui.NvButton,
                  { type: label === 'Close' ? 'plain' : 'default' },
                  () => label,
                ),
              ),
            ]),
            h(
              ui.Tooltip.Root,
              { open: true },
              {
                default: () =>
                  h(ui.Tooltip.Positioner, null, {
                    default: () =>
                      h(ui.StTooltipContent, null, () => 'Tooltip body'),
                  }),
              },
            ),
          ],
        },
      })
      const surface = wrapper.get('#vjt-tooltip').element
      const arrow = wrapper.get('#vjt-arrow').element
      const content = wrapper.get('[data-nv-tour-content]').element
      const tooltip = wrapper.get(
        '[data-scope="tooltip"][data-part="content"]',
      ).element
      for (const [element, property, role, pseudo] of [
        [
          surface,
          'background-color',
          'colors-tour-guide-default-background',
          '',
        ],
        [surface, 'color', 'colors-tour-guide-default-text', ''],
        [surface, 'box-shadow', 'shadows-tour-guide-default-shadow', ''],
        [
          arrow,
          'background-color',
          'colors-tour-guide-default-background',
          '::before',
        ],
        [arrow, 'box-shadow', 'shadows-tour-guide-default-shadow', '::before'],
        [tooltip, 'background-color', 'colors-tooltip-default-background', ''],
        [tooltip, 'color', 'colors-tooltip-default-text', ''],
        [tooltip, 'box-shadow', 'shadows-tooltip-default-shadow', ''],
      ] as const) {
        expect(winningRole(element, property, pseudo)).toBe(`var(--${role})`)
      }
      expect(winningRole(content, 'color')).toBe('inherit')
      for (const button of wrapper.findAll('#vjt-tooltip button')) {
        expect(winningRole(button.element, 'outline')).toBe('0')
        button.element.focus()
        expect(winningRole(button.element, 'outline')).toBe('0')
        expect(winningRole(button.element, 'outline-offset')).toBeUndefined()
        const variant = button.text() === 'Close' ? 'plain' : 'default'
        expect(winningRole(button.element, 'box-shadow')).toBe(
          `0 0 0 0.25rem var(--colors-button-${variant}-focus-ring)`,
        )
        expect(
          winningRole(button.element, `--colors-button-${variant}-focus-ring`),
        ).toBe('var(--colors-tour-guide-default-action-focus-ring)')
        expect(winningRole(button.element, 'transition')).toBe('all .3s')
        button.element.blur()
      }
      expect(
        (wrapper.element as HTMLElement).style.getPropertyValue(
          '--nv-tour-guide-default-action-focus-ring',
        ),
      ).toBe(theme.tourGuide.default['action-focus'].ring)
      expect(
        rules.some(
          (rule) =>
            rule.declarations[
              '--colors-tour-guide-default-action-focus-ring'
            ] === 'var(--nv-tour-guide-default-action-focus-ring)',
        ),
      ).toBe(true)
      for (const [group, values] of [
        ['tour-guide', theme.tourGuide.default],
        ['tooltip', theme.tooltip.default],
      ] as const) {
        for (const role of ['background', 'text', 'shadow'] as const) {
          const value = values[role]
          const variable = `--nv-${group}-default-${role}`
          expect(
            (wrapper.element as HTMLElement).style.getPropertyValue(variable),
          ).toBe(value)
          expect(
            rules.some(
              (rule) =>
                rule.declarations[`--colors-${group}-default-${role}`] ===
                `var(${variable})`,
            ),
            `${group}.${role} resolves the runtime theme variable`,
          ).toBe(true)
          if (role === 'shadow')
            expect(
              rules.some((rule) =>
                rule.declarations[
                  `--shadows-${group}-default-shadow`
                ]?.includes(`var(--colors-${group}-default-shadow)`),
              ),
            ).toBe(true)
        }
      }
    },
  )

  it('keeps divergent Tour and Tooltip roles independently owned', () => {
    const theme = JSON.parse(JSON.stringify(ui.themes.values().next().value))
    theme.tourGuide = {
      default: {
        background: '#123456',
        text: '#abcdef',
        shadow: 'rgba(12, 34, 56, 0.7)',
      },
    }
    theme.tooltip.default = {
      background: '#654321',
      text: '#fedcba',
      shadow: 'rgba(65, 43, 21, 0.3)',
      border: '#987654',
      icon: '#456789',
    }
    const wrapper = render(ui.GlobalStyles, {
      global: { provide: { theme } },
      slots: {
        default: () =>
          h('div', { id: 'vjt-tooltip' }, [h('div', { id: 'vjt-arrow' })]),
      },
    })
    const surface = wrapper.get('#vjt-tooltip').element
    expect(winningRole(surface, 'background-color')).toBe(
      'var(--colors-tour-guide-default-background)',
    )
    expect(winningRole(surface, 'color')).toBe(
      'var(--colors-tour-guide-default-text)',
    )
    expect(winningRole(surface, 'box-shadow')).toBe(
      'var(--shadows-tour-guide-default-shadow)',
    )
    expect(
      winningRole(
        wrapper.get('#vjt-arrow').element,
        'background-color',
        '::before',
      ),
    ).toBe('var(--colors-tour-guide-default-background)')
    for (const [group, values] of Object.entries({
      'tour-guide': theme.tourGuide.default,
      tooltip: theme.tooltip.default,
    })) {
      for (const [role, value] of Object.entries(values)) {
        expect(
          (wrapper.element as HTMLElement).style.getPropertyValue(
            `--nv-${group}-default-${role}`,
          ),
        ).toBe(value)
      }
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
          `var(--colors-button-plain-${
            state === 'active' ? 'pressed' : state
          }-background)`,
      )
      expect(stateRules).toHaveLength(1)
      expect(stateRules[0].selector).toMatch(
        new RegExp(`::\\-webkit-scrollbar-thumb:${state}$`),
      )
    }
  })

  it.each([...ui.themes.keys()])(
    'draws the %s group label with its authored readonly roles and no option highlight',
    (themeId) => {
      const wrapper = render(ui.StSelectGroupLabel, {
        global: { provide: { theme: ui.themes.get(themeId) } },
        slots: { default: () => h('span', 'Voices') },
      })
      const labelRules = emittedRules(wrapper.classes())
      expect(labelRules).toContainEqual(
        expect.objectContaining({
          declarations: { color: 'var(--colors-option-default-readonly-text)' },
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
        'background-color': 'var(--colors-option-default-readonly-separator)',
      })
      expect(
        wrapper.element.style.getPropertyValue(
          '--nv-option-default-readonly-separator',
        ),
      ).toBe(ui.themes.get(themeId).option.default.readonly.separator)
      expect(
        labelRules
          .filter((rule) => rule.selector.includes('> span'))
          .map((rule) => rule.declarations),
      ).toContainEqual({
        'background-color':
          'var(--colors-option-default-readonly-label-mask-background)',
      })
      expect(labelRules.some((rule) => rule.selector.includes(':hover'))).toBe(
        false,
      )
    },
  )

  it('extracts the xs button loading-size override from the shared scale', () => {
    const wrapper = render(ui.NvButton, {
      props: { size: 'xs', loading: true },
    })
    const spinnerRules = emittedRules(wrapper.classes()).filter((rule) =>
      rule.selector.includes('.nv-button__loading > svg'),
    )
    const declarations = spinnerRules.map((rule) => rule.declarations)
    expect(declarations).toContainEqual({ width: 'var(--sizes-4)' })
    expect(declarations).toContainEqual({ height: 'var(--sizes-4)' })
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
      expect.objectContaining({ stroke: 'currentColor' }),
    )
    expect(declarations).toContainEqual({ width: 'var(--sizes-5)' })
    expect(declarations).toContainEqual({ height: 'var(--sizes-5)' })
    expect(declarations).toContainEqual({
      color: 'var(--colors-loading-default-pending-spinner)',
    })
    expect(declarations).toContainEqual(
      expect.objectContaining({ animation: 'spin 2s linear infinite' }),
    )
    expect(emittedRules(spinner.classes())).toContainEqual(
      expect.objectContaining({
        media: '(prefers-reduced-motion: reduce)',
        declarations: { animation: 'none' },
      }),
    )
    expect(css).toContain('@keyframes spin')
    expect(css).toContain('@keyframes nv-loading-dash')
  })
})
