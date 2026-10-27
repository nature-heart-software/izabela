// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, ref, Comment } from 'vue'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

execFileSync(
  process.execPath,
  [resolve(dirname(fileURLToPath(import.meta.url)), 'build-client.mjs')],
  { stdio: 'pipe' },
)
const clientPath = '../../../coverage/ui-client/test-client.js'
const ui = await import(/* @vite-ignore */ clientPath)
const wrappers: VueWrapper[] = []
const hadScrollTo = 'scrollTo' in Element.prototype
function render(component: unknown, options: Record<string, any> = {}) {
  const wrapper = mount(component as any, {
    attachTo: document.body,
    ...options,
    global: {
      provide: {
        theme: ui.themes.get('dark'),
        [ui.PORTAL_TARGET]: document.body,
      },
      ...options.global,
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (!hadScrollTo) delete (Element.prototype as any).scrollTo
})

describe('client build artifact isolation', () => {
  it('keeps the real client bundle outside the production artifact directory', () => {
    const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
    const artifacts = existsSync(dist)
      ? readdirSync(dist, { recursive: true }).map(String)
      : []
    expect(artifacts.filter((name) => /test-client/i.test(name))).toEqual([])
    expect(
      existsSync(
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          '../../../coverage/ui-client/test-client.js',
        ),
      ),
    ).toBe(true)
  })
})

describe('real shared controls', () => {
  it('button forwards clicks and native disabled prevents HTMLElement.click', async () => {
    const w = render(ui.NvButton, { slots: { default: 'Save' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.text()).toBe('Save')
    ;(w.element as HTMLButtonElement).click()
    expect(w.emitted('click')).toHaveLength(1)
    await w.setProps({ disabled: true })
    expect((w.element as HTMLButtonElement).disabled).toBe(true)
    ;(w.element as HTMLButtonElement).click()
    expect(w.emitted('click')).toHaveLength(1)
  })
  it('button can receive focus, renders its real icon, and updates loading overlay', async () => {
    const w = render(ui.NvButton, {
      props: { iconName: 'times', loading: false },
      attrs: { 'aria-label': 'Close' },
    })
    expect(w.find('svg').exists()).toBe(true)
    ;(w.element as HTMLElement).focus()
    expect(document.activeElement).toBe(w.element)
    await w.setProps({ loading: true })
    await nextTick()
    expect(w.find('.el-loading-mask').exists()).toBe(true)
    await w.setProps({ loading: false })
    await flushPromises()
  })
  it('loading currently does not disable the native button', async () => {
    const w = render(ui.NvButton, {
      props: { loading: true },
      slots: { default: 'Pending' },
    })
    expect((w.element as HTMLButtonElement).disabled).toBe(false)
    ;(w.element as HTMLButtonElement).click()
    expect(w.emitted('click')).toHaveLength(1)
  })
  it('switch toggles from external model updates without inventing native semantics', async () => {
    const w = render(ui.NvSwitch, { props: { modelValue: false } })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.attributes('tabindex')).toBe('0')
    await w.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    await w.setProps({ modelValue: true })
    await w.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[true], [false]])
  })
  it('switch currently accepts clicks with a disabled attribute and ignores Space/Enter', async () => {
    const w = render(ui.NvSwitch, { attrs: { disabled: true } })
    ;(w.element as HTMLElement).focus()
    expect(document.activeElement).toBe(w.element)
    await w.trigger('keydown', { key: ' ' })
    await w.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await w.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })
  it.fails('[known issue] disabled switch prevents model updates', async () => {
    const w = render(ui.NvSwitch, { attrs: { disabled: true } })
    await w.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
  it.fails(
    '[known issue] focused switch supports keyboard Space activation',
    async () => {
      const w = render(ui.NvSwitch)
      ;(w.element as HTMLElement).focus()
      await w.trigger('keydown', { key: ' ' })
      expect(w.emitted('update:modelValue')).toEqual([[true]])
    },
  )
  it('range forwards bounds and currently emits strings from the styled input', async () => {
    const w = render(ui.NvRangeInput, {
      props: { modelValue: 2 },
      attrs: { min: 0, max: 10, step: 0.5 },
    })
    const input = w.element as HTMLInputElement
    expect(input.type).toBe('range')
    expect(input.value).toBe('2')
    await w.setValue('4.5')
    expect(w.emitted('update:modelValue')).toEqual([['4.5']])
    await w.setProps({ modelValue: 8 })
    expect(input.value).toBe('8')
    expect(input.step).toBe('0.5')
    expect(input.min).toBe('0')
    expect(input.max).toBe('10')
  })
  it('range preserves native disabled and focus attributes', () => {
    const w = render(ui.NvRangeInput, {
      attrs: { disabled: true, 'aria-label': 'Volume' },
    })
    expect((w.element as HTMLInputElement).disabled).toBe(true)
    expect(w.attributes('aria-label')).toBe('Volume')
    ;(w.element as HTMLElement).focus()
    expect(document.activeElement).not.toBe(w.element)
  })
  it.each([
    [ui.NvInput, 'text'],
    [ui.NvNumberInput, 'number'],
  ])(
    'input wrapper uses the real Element Plus input (%s)',
    async (component, type) => {
      const w = render(component, {
        props: { modelValue: '12' },
        attrs: { placeholder: 'Value', 'aria-label': 'Value' },
      })
      const input = w.get('input')
      expect((input.element as HTMLInputElement).type).toBe(type)
      expect((input.element as HTMLInputElement).value).toBe('12')
      await input.setValue('34')
      expect(
        w.emitted('update:model-value') ?? w.emitted('update:modelValue'),
      ).toEqual([['34']])
      await w.setProps({ modelValue: '56' })
      expect((input.element as HTMLInputElement).value).toBe('56')
      expect((w.vm as any).input).toBe(input.element)
    },
  )
  it('input forwards readonly, disabled, focus and blur to the actual input', async () => {
    const w = render(ui.NvInput, { attrs: { readonly: true, disabled: true } })
    const input = w.get('input')
    expect((input.element as HTMLInputElement).readOnly).toBe(true)
    expect((input.element as HTMLInputElement).disabled).toBe(true)
    await w.setProps({ disabled: false })
    ;(input.element as HTMLElement).focus()
    expect(document.activeElement).toBe(input.element)
    ;(input.element as HTMLElement).blur()
    expect(document.activeElement).not.toBe(input.element)
  })
  it('textarea reflects model input and exposes the native textarea', async () => {
    const w = render(ui.NvTextarea, {
      props: { modelValue: 'before' },
      attrs: { readonly: true, disabled: true, rows: 3 },
    })
    expect(w.element.tagName).toBe('TEXTAREA')
    expect((w.element as HTMLTextAreaElement).readOnly).toBe(true)
    expect((w.element as HTMLTextAreaElement).disabled).toBe(true)
    await w.setProps({ disabled: false, readonly: false })
    await w.setValue('after')
    expect(w.emitted('update:modelValue')).toEqual([['after']])
    expect((w.vm as any).input).toBe(w.element)
    await w.setProps({ modelValue: 'parent' })
    expect((w.element as HTMLTextAreaElement).value).toBe('parent')
  })
  it('tag close comes from its actual shared button', async () => {
    const w = render(ui.NvTag, {
      props: { closable: true },
      slots: { default: 'Selected' },
    })
    expect(w.text()).toContain('Selected')
    await w.get('button').trigger('click')
    expect(w.emitted('close')).toEqual([[]])
  })
  it.fails(
    '[known issue] range model updates are numbers rather than strings',
    async () => {
      const w = render(ui.NvRangeInput, {
        props: { modelValue: 2 },
        attrs: { min: 0, max: 10, step: 0.5 },
      })
      await w.setValue('4.5')
      expect(w.emitted('update:modelValue')).toEqual([[4.5]])
    },
  )
})

const rect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 600,
  bottom: 300,
  width: 600,
  height: 300,
  toJSON() {
    return {}
  },
}
const disconnected = vi.fn()
function installGeometry() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    rect,
  ] as any)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(600)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(300)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: (entries: unknown[]) => void) {}
      observe(target: Element) {
        this.callback([
          {
            target,
            contentRect: rect,
            borderBoxSize: [{ inlineSize: 600, blockSize: 300 }],
          },
        ])
      }
      unobserve() {}
      disconnect() {
        disconnected()
      }
    },
  )
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {
        disconnected()
      }
    },
  )
  if (!Element.prototype.scrollTo)
    Object.defineProperty(Element.prototype, 'scrollTo', {
      configurable: true,
      value() {},
    })
}
async function settle() {
  await nextTick()
  await new Promise((done) => setTimeout(done, 30))
  await flushPromises()
}
async function key(key: string) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  })
  window.dispatchEvent(event)
  await nextTick()
  return event
}
const options = [
  { label: 'Alpha', value: 'a' },
  { label: 'Beta', value: 'b' },
  { label: 'Gamma', value: 'c' },
]

describe('client autocomplete keyboard and lifecycle', () => {
  beforeEach(installGeometry)
  function autocomplete(props: Record<string, unknown> = {}) {
    return render(ui.NvAutocomplete, {
      props: { visible: true, options, ...props },
      slots: {
        reference: () => h('input', { 'aria-label': 'Search' }),
        default: ({ item, active }: any) =>
          h('div', { 'data-active': String(active) }, item?.label),
        fallback: 'Empty options',
      },
    })
  }
  it('renders actual virtualized option content and selects with ArrowDown/Enter', async () => {
    const w = autocomplete()
    await settle()
    expect(document.body.textContent).toContain('Alpha')
    expect(document.body.textContent).toContain('Gamma')
    const event = await key('ArrowDown')
    expect(event.defaultPrevented).toBe(true)
    await key('Enter')
    expect(w.emitted('select')).toEqual([[options[0]]])
  })
  it('wraps both directions and respects autoScrollIndex', async () => {
    const w = autocomplete({ autoScrollIndex: 2 })
    await settle()
    await key('Enter')
    await key('ArrowDown')
    await key('Enter')
    await key('ArrowUp')
    await key('Enter')
    expect(w.emitted('select')).toEqual([
      [options[2]],
      [options[0]],
      [options[2]],
    ])
  })
  it('selects on Tab only when enabled and ignores hidden keyboard input', async () => {
    const w = autocomplete({ autoScrollIndex: 0 })
    await settle()
    expect((await key('Tab')).defaultPrevented).toBe(false)
    expect(w.emitted('select')).toBeUndefined()
    await w.setProps({ selectOnTab: true })
    expect((await key('Tab')).defaultPrevented).toBe(true)
    expect(w.emitted('select')).toEqual([[options[0]]])
    await w.setProps({ visible: false })
    await key('ArrowDown')
    await key('Enter')
    await key('Tab')
    expect(w.emitted('select')).toHaveLength(1)
  })
  it('resets selection when options change and renders empty fallback', async () => {
    const w = autocomplete({ autoScrollIndex: 2 })
    await settle()
    const replacement = [{ label: 'Replacement', value: 1 }]
    await w.setProps({ options: replacement })
    await key('Enter')
    expect(w.emitted('select')).toEqual([[replacement[0]]])
    await w.setProps({ options: [] })
    await settle()
    expect(document.body.textContent).toContain('Empty options')
  })
  it('cleans up virtualizer observers, teleports and keyboard subscriptions on unmount', async () => {
    const selected = vi.fn()
    const w = autocomplete({ autoScrollIndex: 0, onSelect: selected })
    await settle()
    await key('Enter')
    expect(selected).toHaveBeenCalledExactlyOnceWith(options[0])
    const before = disconnected.mock.calls.length
    w.unmount()
    wrappers.splice(wrappers.indexOf(w), 1)
    await settle()
    await key('ArrowDown')
    await key('Enter')
    expect(selected).toHaveBeenCalledTimes(1)
    expect(disconnected.mock.calls.length).toBeGreaterThan(before)
    expect(document.body.textContent).not.toContain('Alpha')
  })
})

describe('real select composition', () => {
  beforeEach(installGeometry)
  it('single selection updates the public model from the actual keyboard autocomplete', async () => {
    const w = render(ui.NvSelect, {
      props: { options, modelValue: 'b' },
      attrs: { placeholder: 'Pick' },
    })
    const input = w.get('input')
    await settle()
    ;(input.element as HTMLInputElement).focus()
    await settle()
    await key('ArrowDown')
    await key('Enter')
    expect(w.emitted('update:modelValue')).toEqual([['c']])
  })
  it('multiple selection removes a tag through its actual close button', async () => {
    const values = ['a', 'b']
    const w = render(ui.NvSelect, {
      props: { options, modelValue: values, multiple: true },
    })
    expect(w.text()).toContain('Alpha')
    expect(w.text()).toContain('Beta')
    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[['b']]])
    expect(values).toEqual(['a', 'b'])
  })
  it('matches object values using valueKey and responds to external model changes', async () => {
    const w = render(ui.NvSelect, {
      props: {
        options: [
          { label: 'One', value: { id: 1 } },
          { label: 'Two', value: { id: 2 } },
        ],
        modelValue: [{ id: 1 }],
        multiple: true,
        valueKey: 'id',
      },
    })
    expect(w.text()).toContain('One')
    await w.setProps({ modelValue: [{ id: 2 }] })
    expect(w.text()).toContain('Two')
    expect(w.text()).not.toContain('One')
  })
  it('searches real options, selects the filtered result, and Escape clears the popup', async () => {
    const w = render(ui.NvSelect, { props: { options } })
    await settle()
    const input = w.get('input')
    ;(input.element as HTMLElement).focus()
    await settle()
    await input.setValue('Gamma')
    await settle()
    expect(document.body.querySelector('.autocomplete')?.textContent).toContain(
      'Gamma',
    )
    expect(
      document.body.querySelector('.autocomplete')?.textContent,
    ).not.toContain('Alpha')
    await key('Enter')
    expect(w.emitted('update:modelValue')).toEqual([['c']])
    await key('Escape')
    await settle()
    expect(document.body.querySelector('.autocomplete')).toBeNull()
  })
  async function blockedSelection() {
    const w = render(ui.NvSelect, {
      props: {
        options: [{ label: 'Blocked', value: 'blocked', disabled: true }],
        modelValue: null,
      },
    })
    await settle()
    ;(w.get('input').element as HTMLElement).focus()
    await settle()
    await key('ArrowDown')
    await key('Enter')
    return w
  }
  it('currently selects disabled options through keyboard even though their pointer style is disabled', async () => {
    const w = await blockedSelection()
    expect(w.emitted('update:modelValue')).toEqual([['blocked']])
  })
  it.fails(
    '[known issue] select keyboard activation ignores disabled options',
    async () => {
      const w = await blockedSelection()
      expect(w.emitted('update:modelValue')).toBeUndefined()
    },
  )
  it('group headings are not selectable but their actual child options are', async () => {
    const w = render(ui.NvSelect, {
      props: {
        options: [{ label: 'Group', children: [{ label: 'Child', value: 7 }] }],
        modelValue: null,
      },
    })
    await settle()
    ;(w.get('input').element as HTMLElement).focus()
    await settle()
    await key('ArrowDown')
    await key('Enter')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await key('ArrowDown')
    await key('Enter')
    expect(w.emitted('update:modelValue')).toEqual([[7]])
  })
})

describe('rendered composition and helper contracts', () => {
  it('form item connects its label to a real child input and omits empty labels', async () => {
    const w = render(ui.NvFormItem, {
      props: { label: 'Name', name: 'name' },
      slots: {
        default: () => h(ui.NvInput, { id: 'name', modelValue: 'Ada' }),
      },
    })
    expect(w.get('label').attributes('for')).toBe('name')
    expect(w.get('input').attributes('id')).toBe('name')
    await w.setProps({ label: '' })
    expect(w.find('label').exists()).toBe(false)
  })
  it('access blocker updates reason visibility without removing its children', async () => {
    const w = render(ui.NvAccessBlocker, {
      props: { allowed: false, reason: 'Sign in' },
      slots: { default: 'Protected content' },
    })
    expect(w.text()).toContain('Sign in')
    expect(w.text()).toContain('Protected content')
    await w.setProps({ allowed: true })
    await settle()
    expect(w.text()).not.toContain('Sign in')
    expect(w.text()).toContain('Protected content')
  })
  it.each(['success', 'warning', 'info', 'error'])(
    'alert renders %s content without claiming an implicit alert role',
    (type) => {
      const w = render(ui.NvAlert, {
        props: { type },
        slots: { default: 'Message' },
      })
      expect(w.text()).toBe('Message')
      expect(w.attributes('role')).toBeUndefined()
    },
  )
  it('text and layout preserve slots, polymorphic elements and supplied attributes', () => {
    const w = render(ui.NvGroup, {
      props: { as: 'section', spacing: 2 },
      attrs: { 'aria-label': 'Actions' },
      slots: { default: () => h(ui.NvText, { as: 'strong' }, () => 'Details') },
    })
    expect(w.element.tagName).toBe('SECTION')
    expect(w.attributes('aria-label')).toBe('Actions')
    expect(w.get('strong').text()).toBe('Details')
  })
  it('getElement unwraps native elements, component refs, selectors and absent values', () => {
    const element = document.createElement('div')
    element.id = 'target'
    document.body.append(element)
    expect(ui.getElement(element)).toBe(element)
    expect(ui.getElement(ref(element))).toBe(element)
    expect(ui.getElement({ $el: element })).toBe(element)
    expect(ui.getElement('#target')).toBe(element)
    expect(ui.getElement('#missing')).toBeNull()
    expect(ui.getElement(null)).toBeNull()
    expect(ui.getElement({})).toBeNull()
    expect(() => ui.getElement('[')).toThrow()
  })
  it('slot emptiness distinguishes text content, comments and childless nodes', () => {
    expect(ui.isVNodeEmpty(undefined)).toBe(true)
    expect(ui.isVNodeEmpty(() => [])).toBe(true)
    expect(ui.isVNodeEmpty(() => h(Comment))).toBe(true)
    expect(ui.isVNodeEmpty(() => h('div'))).toBe(true)
    expect(ui.isVNodeEmpty(() => h('div', 'text'))).toBe(false)
    const data = { label: 'slot' }
    expect(
      ui.isVNodeEmpty((received: unknown) => {
        expect(received).toBe(data)
        return h('span', 'content')
      }, data),
    ).toBe(false)
    expect(ui.isVNodeEmpty(() => null)).toBe(false)
  })
  it('font helpers preserve scalar and tuple units and derive combined styles', () => {
    expect(ui.fontSize(16)).toBe('1rem')
    expect(
      ui.fontSize(['20px', { lineHeight: '24px', letterSpacing: '2px' }]),
    ).toBe('1.25rem')
    expect(ui.lineHeight(16)).toBe(1)
    expect(ui.lineHeight([16, { lineHeight: 1.5 }])).toBe(1.5)
    expect(ui.letterSpacing(16)).toBe('normal')
    expect(
      ui.fontSizeStyle(['20px', { lineHeight: '24px', letterSpacing: '2px' }]),
    ).toEqual({
      fontSize: '1.25rem',
      lineHeight: '1.5rem',
      letterSpacing: '0.125rem',
    })
  })
  it.each(['xs', 'sm', 'md', 'lg'])(
    'size helpers produce actual radius/padding/icon contracts for %s',
    (size) => {
      const padding = ui.paddingStyleBySize(size)
      expect(padding.paddingLeft).toMatch(/rem$/)
      expect(padding.paddingLeft).toBe(padding.paddingRight)
      expect(ui.horizontalPaddingStyleBySize(size).paddingLeft).toBe(
        padding.paddingLeft,
      )
      expect(ui.borderRadiusStyleBySize(size).borderRadius).toMatch(/rem$/)
      expect(
        ui.horizontalPaddingWithIconStyleBySize(size).paddingRight,
      ).not.toBe(padding.paddingLeft)
      expect(ui.iconStyleBySize(size).right).toMatch(/rem$/)
    },
  )
  it('table and column render real row data and scoped slot content', async () => {
    installGeometry()
    const w = render(ui.NvTable, {
      attrs: { data: [{ name: 'Ada' }, { name: 'Grace' }] },
      slots: {
        default: () =>
          h(
            ui.NvTableColumn,
            { prop: 'name', label: 'Name' },
            { default: ({ row }: any) => h('strong', row.name) },
          ),
      },
    })
    await settle()
    expect(w.text()).toContain('Name')
    expect(w.text()).toContain('Ada')
    expect(w.text()).toContain('Grace')
    expect(w.findAll('tbody strong').map((node) => node.text())).toEqual([
      'Ada',
      'Grace',
    ])
  })
})

describe('real overlay controls', () => {
  beforeEach(installGeometry)
  it('popover opens from its actual trigger and removes portalled content on unmount', async () => {
    const w = render(ui.NvPopover, {
      slots: {
        reference: () => h('button', 'Details'),
        default: 'Popover content',
      },
    })
    await settle()
    await w.get('button').trigger('click')
    await settle()
    expect(document.body.textContent).toContain('Popover content')
    w.unmount()
    wrappers.splice(wrappers.indexOf(w), 1)
    await settle()
    expect(document.body.textContent).not.toContain('Popover content')
  })
  it('dialog opens with title/description, closes via its actual close trigger and supports controlled open', async () => {
    const w = render(ui.NvDialog, {
      slots: {
        reference: () => h('span', 'Open dialog'),
        title: 'Dialog title',
        description: 'Dialog description',
        footer: () => h('button', 'Confirm'),
      },
    })
    await settle()
    await w.get('[data-part="trigger"]').trigger('click')
    await settle()
    expect(
      document.body.querySelector('[role="dialog"]')?.textContent,
    ).toContain('Dialog title')
    expect(document.body.textContent).toContain('Dialog description')
    const close = document.body.querySelector(
      '[data-part="close-trigger"]',
    ) as HTMLElement
    close.click()
    await settle()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    await w.setProps({ open: true })
    await settle()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    ;(
      document.body.querySelector('[data-part="close-trigger"]') as HTMLElement
    ).click()
    await nextTick()
    expect(w.emitted('update:open')).toEqual([[false]])
  })
  it('dialog accepts focus inside its real content and requests close on Escape', async () => {
    const w = render(ui.NvDialog, {
      props: { open: true },
      slots: {
        reference: () => h('span', 'Open'),
        title: 'Keyboard dialog',
        footer: () => h('input', { 'aria-label': 'Dialog input' }),
      },
    })
    await settle()
    const input = document.body.querySelector(
      '[role="dialog"] input',
    ) as HTMLInputElement
    input.focus()
    expect(document.activeElement).toBe(input)
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await settle()
    expect(w.emitted('update:open')).toEqual([[false]])
  })
  it('context menu renders its options and calls the selected option callback', async () => {
    const onClick = vi.fn()
    const w = render(ui.NvContextMenu, {
      props: {
        options: [
          { label: 'Run', onClick },
          { type: 'divider' },
          { label: 'Other' },
        ],
        tippyOptions: { duration: 0 },
      },
      slots: { default: () => h('button', 'Menu') },
    })
    await settle()
    await w.get('button').trigger('click')
    await settle()
    const option = Array.from(
      document.body.querySelectorAll('.option__content'),
    ).find((node) => node.textContent?.trim() === 'Run') as HTMLElement
    expect(option, document.body.innerHTML).toBeDefined()
    option.click()
    await settle()
    expect(onClick).toHaveBeenCalledExactlyOnceWith()
  })
  it('tooltip uses the real Tippy renderer and cleans up its generated popper', async () => {
    const w = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: 0, duration: 0 } },
      slots: {
        reference: () => h('button', 'Help'),
        default: 'Tooltip content',
      },
    })
    await settle()
    await w.get('[data-v-tippy]').trigger('mouseenter')
    await settle()
    expect(
      document.body.querySelector('[role="tooltip"]')?.textContent,
    ).toContain('Tooltip content')
    const reference = w.get('[data-v-tippy]').element as HTMLElement & {
      _tippy: { state: { isEnabled: boolean } }
    }
    expect(reference._tippy.state.isEnabled).toBe(true)
    ;(w.get('button').element as HTMLElement).focus()
    await nextTick()
    expect(reference._tippy.state.isEnabled).toBe(false)
    ;(w.get('button').element as HTMLElement).blur()
    await nextTick()
    expect(reference._tippy.state.isEnabled).toBe(true)
    w.unmount()
    wrappers.splice(wrappers.indexOf(w), 1)
    await settle()
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
  })
})
