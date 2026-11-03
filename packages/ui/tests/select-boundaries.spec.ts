// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
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
const options = [
  { label: 'Alpha', value: 'a' },
  { label: 'Beta', value: 'b' },
]
function render(component: any, config: Record<string, any> = {}) {
  const wrapper = mount(component, {
    attachTo: document.body,
    ...config,
    global: {
      provide: {
        theme: ui.themes.get('dark'),
        [ui.PORTAL_TARGET]: document.body,
      },
      ...config.global,
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
async function settle() {
  await nextTick()
  await new Promise((done) => setTimeout(done, 40))
  await flushPromises()
}
async function key(target: EventTarget, key: string) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  })
  const focused = document.activeElement
  ;(target === window && focused && focused !== document.body
    ? focused
    : target
  ).dispatchEvent(event)
  await settle()
  return event
}
beforeEach(() => {
  const rect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 300,
    bottom: 100,
    width: 300,
    height: 100,
    toJSON() {
      return {}
    },
  }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    rect,
  ] as any)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: (entries: any[]) => void) {}
      observe(target: Element) {
        this.callback([
          {
            target,
            contentRect: rect,
            borderBoxSize: [{ inlineSize: 300, blockSize: 100 }],
          },
        ])
      }
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  if (!Element.prototype.scrollTo)
    Object.defineProperty(Element.prototype, 'scrollTo', {
      configurable: true,
      value() {},
    })
})
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('compiled Select and Autocomplete interaction boundaries', () => {
  it('forwards placement to its floating dropdown instead of the native input', async () => {
    const wrapper = render(ui.NvSelect, {
      props: { options, placement: 'top-start' },
    })
    const autocomplete = wrapper.findComponent(ui.NvAutocomplete)
    expect(autocomplete.props('placement')).toBe('top-start')
    expect(wrapper.get('input').attributes('placement')).toBeUndefined()
    await wrapper.setProps({ placement: 'top-end' })
    expect(autocomplete.props('placement')).toBe('top-end')
    expect(wrapper.get('input').attributes('placement')).toBeUndefined()
  })

  it.each([false, true])(
    'keeps the Select shield through the full gesture (nested=%s)',
    async (nested) => {
      const underlying = vi.fn()
      const select = () => h(ui.NvSelect, { options, modelValue: 'a' })
      const w = render(
        nested
          ? {
              render: () =>
                h(
                  ui.NvDialog,
                  {},
                  {
                    reference: () =>
                      h(
                        'span',
                        { id: 'parent-dialog-reference' },
                        'Open parent',
                      ),
                    title: () => 'Parent',
                    footer: () =>
                      h(
                        ui.NvPopover,
                        {},
                        {
                          reference: () =>
                            h(
                              'button',
                              { id: 'parent-popover-trigger' },
                              'More',
                            ),
                          default: () =>
                            h(
                              'section',
                              {
                                id: 'parent-popup',
                                onPointerup: underlying,
                                onMouseup: underlying,
                                onClick: underlying,
                              },
                              [select()],
                            ),
                        },
                      ),
                  },
                ),
            }
          : {
              render: () =>
                h(
                  'section',
                  {
                    onPointerup: underlying,
                    onMouseup: underlying,
                    onClick: underlying,
                  },
                  [select()],
                ),
            },
      )
      await settle()
      if (nested) {
        ;(
          document.getElementById('parent-dialog-reference') as HTMLElement
        ).click()
        await settle()
        ;(
          document.getElementById('parent-popover-trigger') as HTMLElement
        ).click()
        await settle()
      }
      const input = document.querySelector('input') as HTMLInputElement
      input.focus()
      await settle()
      const shield = document.querySelector(
        '[data-nv-overlay-shield]',
      ) as HTMLElement
      expect(shield).not.toBeNull()
      expect(shield.style.display).not.toBe('none')
      const dialog = document.querySelector(
        '[data-scope="dialog"][role="dialog"]',
      )
      const parent = document.getElementById('parent-popup')
      underlying.mockClear()
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
        const event = new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          button: 0,
        })
        shield.dispatchEvent(event)
        await settle()
        expect(event.defaultPrevented, type).toBe(true)
        expect(shield.style.display, type).not.toBe('none')
        expect(document.querySelector('.autocomplete'), type).not.toBeNull()
        if (nested) {
          expect(document.getElementById('parent-popup'), type).toBe(parent)
          expect(
            parent
              ?.closest('[data-scope="popover"][data-part="content"]')
              ?.contains(shield),
            'child portal remains physically inside its parent popup',
          ).toBe(true)
        }
      }
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })
      shield.dispatchEvent(click)
      await settle()
      expect(click.defaultPrevented).toBe(true)
      expect(shield.style.display).toBe('none')
      expect(document.querySelector('.autocomplete')).toBeNull()
      expect(underlying).not.toHaveBeenCalled()
      if (nested) {
        expect(document.getElementById('parent-popup')).toBe(parent)
        expect(
          document.querySelector('[data-scope="dialog"][role="dialog"]'),
        ).toBe(dialog)
      }
    },
  )

  it('forwards naming and native control attributes to the actual input only', async () => {
    const w = render(ui.NvSelect, {
      props: { options },
      attrs: {
        id: 'voice',
        name: 'voice-name',
        'aria-label': 'Voice',
        'aria-labelledby': 'voice-label',
        'aria-describedby': 'voice-help',
        placeholder: 'Pick voice',
        required: true,
      },
    })
    const input = w.get('input').element as HTMLInputElement
    expect(input.id).toBe('voice')
    expect(input.name).toBe('voice-name')
    expect(input.getAttribute('aria-label')).toBe('Voice')
    expect(input.getAttribute('aria-labelledby')).toBe('voice-label')
    expect(input.getAttribute('aria-describedby')).toBe('voice-help')
    expect(input.placeholder).toBe('Pick voice')
    expect(input.required).toBe(true)
    expect(document.querySelectorAll('#voice')).toHaveLength(1)
    expect(w.element.getAttribute('aria-label')).toBeNull()
  })

  it.each(['disabled', 'readonly'])(
    'prevents open, edit, selection and tag removal when %s',
    async (state) => {
      const w = render(ui.NvSelect, {
        props: { options, multiple: true, modelValue: ['a'], [state]: true },
      })
      const input = w.get('input').element as HTMLInputElement
      expect(state === 'disabled' ? input.disabled : input.readOnly).toBe(true)
      input.focus()
      input.click()
      await key(input, 'ArrowDown')
      await key(input, 'Enter')
      expect(document.querySelector('.autocomplete')).toBeNull()
      expect(w.emitted('update:modelValue')).toBeUndefined()
      input.value = 'changed'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await settle()
      expect(input.value).toBe('')
      const tag = w.findComponent({ name: 'NvTag' })
      tag.vm.$emit('close')
      await settle()
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(tag.props('closable')).toBe(false)

      await w.setProps({ [state]: false })
      input.focus()
      input.click()
      await settle()
      expect(document.querySelector('.autocomplete')).not.toBeNull()
      await w.setProps({ [state]: true })
      await settle()
      expect(document.querySelector('.autocomplete')).toBeNull()
      // Stale queued child selection cannot bypass a newly locked parent.
      w.findComponent({ name: 'NvAutocomplete' }).vm.$emit('select', options[1])
      await settle()
      expect(w.emitted('update:modelValue')).toBeUndefined()
    },
  )

  it('never selects undefined from an empty or newly emptied Autocomplete', async () => {
    const w = render(ui.NvAutocomplete, {
      props: {
        visible: true,
        options: [],
        selectOnTab: true,
        autoScrollIndex: -1,
      },
      slots: { reference: () => h('input'), fallback: 'No matches' },
    })
    await settle()
    for (const stroke of ['ArrowDown', 'Enter', 'ArrowUp', 'Enter', 'Tab'])
      await key(window, stroke)
    expect(w.emitted('select')).toBeUndefined()
    await w.setProps({ options, autoScrollIndex: 1 })
    await settle()
    await key(window, 'ArrowDown')
    await w.setProps({ options: [] })
    await key(window, 'Enter')
    await key(window, 'Tab')
    expect(w.emitted('select')).toBeUndefined()
  })

  it.each([-1, 2, 1.5, Infinity])(
    'rejects invalid autoScrollIndex %s before keyboard selection',
    async (autoScrollIndex) => {
      const w = render(ui.NvAutocomplete, {
        props: { visible: true, options, autoScrollIndex, selectOnTab: true },
        slots: {
          reference: () => h('input'),
          default: ({ item }: any) => h('div', item.label),
        },
      })
      await settle()
      await key(window, 'Enter')
      await key(window, 'Tab')
      expect(w.emitted('select')).toBeUndefined()
      await key(window, 'ArrowDown')
      await key(window, 'Enter')
      expect(w.emitted('select')).toEqual([[options[0]]])
    },
  )

  it('ignores stale selected values when deriving the visible option scroll index', async () => {
    const w = render(ui.NvSelect, {
      props: { multiple: true, options, modelValue: ['missing', 'b'] },
    })
    const autocomplete = w.findComponent({ name: 'NvAutocomplete' })
    expect(autocomplete.props('autoScrollIndex')).toBe(1)
    await w.setProps({ modelValue: ['missing'] })
    expect(autocomplete.props('autoScrollIndex')).toBeUndefined()
    await w.setProps({ modelValue: ['b'] })
    ;(w.get('input').element as HTMLInputElement).focus()
    await settle()
    await w.get('input').setValue('Beta')
    await settle()
    expect(autocomplete.props('options')).toHaveLength(1)
    expect(autocomplete.props('autoScrollIndex')).toBe(0)
    await w.get('input').setValue('zzzz-unmatched')
    await settle()
    expect(autocomplete.props('autoScrollIndex')).toBeUndefined()
    await key(window, 'ArrowDown')
    await key(window, 'Enter')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('preserves legacy option typography/color and small Select padding in emitted CSS', async () => {
    const option = render(ui.NvOption, { slots: { default: 'Alpha' } })
    const select = render(ui.NvSelect, { props: { options, size: 'sm' } })
    await settle()
    const css = readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../src/styled-system/styles.css',
      ),
      'utf8',
    )
    function emitted(element: Element) {
      const declarations: Record<string, string> = {}
      for (const [, selector, body] of css.matchAll(
        /((?:\\.|[^{}])+)\{([^{}]*)\}/g,
      )) {
        try {
          if (!element.matches(selector.trim())) continue
          const style = document.createElement('div').style
          style.cssText = body
          for (const property of style)
            declarations[property] = style.getPropertyValue(property)
        } catch {}
      }
      return declarations
    }
    const styles = emitted(option.element)
    expect(styles['font-size']).toBe('var(--font-sizes-2)')
    expect(styles['font-family']).toBe('var(--fonts-sans)')
    expect(styles.color).toBe('var(--nv-text-color)')
    expect(css).toMatch(/--font-sizes-2:\s*0\.875rem/)
    expect(css).toMatch(/--fonts-sans:[^;]*Nunito/)
    expect(
      emitted(select.get('[data-part="anchor"] > div').element)[
        'padding-right'
      ],
    ).toBe('calc(var(--spacing-3) + var(--spacing-5))')
  })

  it('keeps a real NvInput reference editable and anchors independently of its consumer ID', async () => {
    const updates = vi.fn()
    const w = render(ui.NvAutocomplete, {
      props: { visible: true, options },
      slots: {
        reference: () =>
          h(ui.NvInput, {
            id: 'editable-search',
            modelValue: '',
            'aria-label': 'Search',
            'onUpdate:modelValue': updates,
          }),
        default: ({ item }: any) => h('div', item.label),
      },
    })
    await settle()
    const input = w.get('input').element as HTMLInputElement
    expect(input.type).toBe('text')
    expect(input.id).toBe('editable-search')
    const anchor = w.get('[data-part="anchor"]').element
    expect(anchor.contains(input)).toBe(true)
    expect(anchor.id).not.toBe(input.id)
    await w.get('input').setValue('Beta')
    expect(updates).toHaveBeenCalledExactlyOnceWith('Beta')
    expect(
      document.querySelector('[data-part="positioner"]')?.getAttribute('style'),
    ).toContain('--reference-width: 300px')
    // Clicking/focusing the editable anchor is not an outside dismissal.
    input.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true }),
    )
    input.focus()
    await settle()
    expect(w.emitted('interactOutside')).toBeUndefined()
    expect(w.emitted('focusOutside')).toBeUndefined()
  })

  it('keeps the option surface through pointer release and selects only on click', async () => {
    const w = render(ui.NvSelect, { props: { options, modelValue: 'a' } })
    await settle()
    ;(w.get('input').element as HTMLInputElement).focus()
    await settle()
    const option = [
      ...document.querySelectorAll('.autocomplete .option__content'),
    ].find((element) => element.textContent?.includes('Beta'))
      ?.parentElement as HTMLElement
    expect(option).toBeTruthy()
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
      option.dispatchEvent(
        new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }),
      )
      await settle()
      expect(w.emitted('update:modelValue'), type).toBeUndefined()
      expect(document.querySelector('.autocomplete'), type).not.toBeNull()
    }
    option.click()
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([['b']])
    expect(document.querySelector('.autocomplete')).toBeNull()
  })

  it('uses an important positioner recipe above its shield despite Ark inline z-index', async () => {
    render(ui.NvAutocomplete, {
      props: { visible: true, options },
      slots: {
        reference: () => h('input'),
        default: ({ item }: any) => h('div', item.label),
      },
    })
    await settle()
    const positioner = document.querySelector(
      '[data-scope="popover"][data-part="positioner"]',
    ) as HTMLElement
    const shield = document.querySelector(
      '[data-nv-overlay-shield]',
    ) as HTMLElement
    expect(positioner.style.zIndex).toContain('var(')
    const css = readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../src/styled-system/styles.css',
      ),
      'utf8',
    )
    const rules = [...css.matchAll(/((?:\\.|[^{}])+)\{([^{}]*)\}/g)]
    const importantZIndex = rules.filter(([, , body]) =>
      /z-index:\s*9999\s*!important/.test(body),
    )
    // CSS extraction plus the actual compiled primitive: jsdom cannot prove native hit-testing.
    expect(
      importantZIndex.some(([, selector]) => {
        try {
          return positioner.matches(selector.trim())
        } catch {
          return false
        }
      }),
    ).toBe(true)
    expect(shield.className).toContain('9999')
  })
})
