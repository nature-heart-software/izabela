// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { execFileSync } from 'node:child_process'
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
const hitTestDescriptor = Object.getOwnPropertyDescriptor(
  document,
  'elementsFromPoint',
)
function render(component: unknown, options: Record<string, any> = {}) {
  const wrapper = mount(component as any, {
    attachTo: document.body,
    ...options,
    global: {
      provide: {
        theme: ui.themes.get('izabela-dark'),
        [ui.PORTAL_TARGET]: document.body,
      },
      ...options.global,
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
async function settle() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 40))
  await flushPromises()
}
async function key(target: Element, key: string, shiftKey = false) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
    }),
  )
  await settle()
}
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
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
})
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  if (hitTestDescriptor)
    Object.defineProperty(document, 'elementsFromPoint', hitTestDescriptor)
  else Reflect.deleteProperty(document, 'elementsFromPoint')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('overlay interaction boundaries', () => {
  it.each(['popover', 'dialog'])(
    '%s traps Tab and Shift+Tab at its edges and restores focus after Escape',
    async (kind) => {
      const outside = document.createElement('button')
      outside.textContent = 'Outside'
      document.body.append(outside)
      const fields = () => [
        h('input', { id: 'trap-first' }),
        h('button', { id: 'trap-last' }, 'Last'),
      ]
      const wrapper = render(kind === 'popover' ? ui.NvPopover : ui.NvDialog, {
        slots: {
          reference: () => h('button', { id: 'trap-trigger' }, 'Open'),
          title: 'Focus trap',
          default: fields,
          footer: fields,
        },
      })
      const trigger = wrapper.get('#trap-trigger').element as HTMLElement
      trigger.focus()
      trigger.click()
      await vi.waitFor(() =>
        expect(
          document.activeElement?.closest(
            `[data-scope="${kind}"][data-part="content"]`,
          ),
        ).not.toBeNull(),
      )
      const content = document.querySelector(
        `[data-scope="${kind}"][data-part="content"]`,
      )!
      const first = content.querySelector<HTMLElement>('button, input')!
      const last = document.getElementById('trap-last')!
      last.focus()
      await key(last, 'Tab')
      expect(document.activeElement).toBe(first)
      await key(first, 'Tab', true)
      expect(document.activeElement).toBe(last)
      outside.focus()
      expect(content.contains(document.activeElement)).toBe(true)
      await key(document.activeElement!, 'Escape')
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
      outside.focus()
      expect(document.activeElement).toBe(outside)
    },
  )

  it('focuses the first enabled control on popover open and restores its trigger on Escape', async () => {
    const wrapper = render(ui.NvPopover, {
      slots: {
        reference: () => h('button', { id: 'focus-popover-trigger' }, 'Open'),
        default: () => [
          h('button', { disabled: true }, 'Unavailable'),
          h('input', { id: 'first-popover-control' }),
          h('button', 'Last control'),
        ],
      },
    })
    const trigger = wrapper.get('#focus-popover-trigger').element as HTMLElement
    const previous = document.createElement('input')
    document.body.append(previous)
    previous.focus()
    trigger.click()
    await settle()
    const input = document.getElementById('first-popover-control')!
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
    await key(input, 'Escape')
    expect(document.activeElement).toBe(trigger)
    expect(document.getElementById('first-popover-control')).toBeNull()
  })

  it.each(['select', 'popover'])(
    'allows page scrolling through the %s shield without dismissing or clicking through',
    async (kind) => {
      const page = document.createElement('div')
      page.style.overflowX = page.style.overflowY = 'auto'
      const action = document.createElement('button')
      const clicked = vi.fn()
      action.addEventListener('click', clicked)
      page.append(action)
      document.body.append(page)
      Object.defineProperties(page, {
        clientHeight: { value: 200 },
        scrollHeight: { value: 1000 },
        clientWidth: { value: 200 },
        scrollWidth: { value: 1000 },
      })
      Object.defineProperty(page, 'scrollTo', {
        configurable: true,
        value: ({ top, left }: ScrollToOptions) => {
          if (top !== undefined) page.scrollTop = top
          if (left !== undefined) page.scrollLeft = left
        },
      })
      const wrapper =
        kind === 'select'
          ? render(ui.NvSelect, {
              props: { options: [{ label: 'Alpha', value: 'a' }] },
            })
          : render(ui.NvPopover, {
              slots: {
                reference: () => h('button', 'Open'),
                default: 'Content',
              },
            })
      await settle()
      const trigger = wrapper.get(kind === 'select' ? 'input' : 'button')
        .element as HTMLElement
      // HTMLElement.click() does not perform the browser's focus default in jsdom.
      trigger.focus()
      trigger.click()
      await settle()
      const shield = document.querySelector<HTMLElement>(
        kind === 'select'
          ? '[data-nv-overlay-shield]'
          : '[data-overlay-shield="popover"]',
      )!
      expect(shield).not.toBeNull()
      expect(getComputedStyle(shield).display).not.toBe('none')
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        value: () => [
          shield,
          action,
          page,
          document.body,
          document.documentElement,
        ],
      })
      const wheel = new WheelEvent('wheel', {
        deltaY: 120,
        deltaX: 35,
        clientX: 30,
        clientY: 40,
        bubbles: true,
        cancelable: true,
      })
      shield.dispatchEvent(wheel)
      await settle()
      expect(page.scrollTop).toBe(120)
      expect(page.scrollLeft).toBe(35)
      expect(wheel.defaultPrevented).toBe(true)
      expect(shield.isConnected).toBe(true)
      expect(getComputedStyle(shield).display).not.toBe('none')
      expect(clicked).not.toHaveBeenCalled()
    },
  )

  it('nested popover stays inside the dialog portal and Escape closes only the top layer', async () => {
    const parentEscape = vi.fn()
    const wrapper = render(ui.NvDialog, {
      attrs: { onEscapeKeyDown: parentEscape },
      slots: {
        reference: () => h('span', 'Open dialog'),
        title: 'Parent dialog',
        footer: () =>
          h(
            ui.NvPopover,
            {},
            {
              reference: () =>
                h(
                  'button',
                  { 'data-testid': 'nested-popover-trigger' },
                  'More',
                ),
              default: () =>
                h('input', {
                  id: 'nested-popover-input',
                  'aria-label': 'Nested input',
                }),
            },
          ),
      },
    })
    await settle()
    ;(wrapper.get('[data-part="trigger"]').element as HTMLElement).click()
    await settle()
    const dialog = document.querySelector(
      '[data-scope="dialog"][role="dialog"]',
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    ;(
      document.querySelector(
        '[data-testid="nested-popover-trigger"]',
      ) as HTMLElement
    ).click()
    await settle()
    const input = document.getElementById(
      'nested-popover-input',
    ) as HTMLInputElement
    expect(input).not.toBeNull()
    expect(dialog.contains(input)).toBe(true)
    input.focus()
    await settle()
    expect(document.activeElement).toBe(input)
    await key(input, 'Escape')
    expect(parentEscape).not.toHaveBeenCalled()
    expect(document.getElementById('nested-popover-input')).toBeNull()
    expect(document.querySelector('[data-scope="dialog"][role="dialog"]')).toBe(
      dialog,
    )
    const trigger = document.querySelector(
      '[data-testid="nested-popover-trigger"]',
    ) as HTMLElement
    expect(document.activeElement).toBe(trigger)
    await key(trigger, 'Escape')
    expect(
      document.querySelector('[data-scope="dialog"][role="dialog"]'),
    ).toBeNull()
  })

  it.each(['popover', 'dialog'])(
    'keeps a nested popover and its parent %s open when outside focus is reclaimed',
    async (kind) => {
      const outside = document.createElement('button')
      document.body.append(outside)
      const child = () =>
        h(
          ui.NvPopover,
          {},
          {
            reference: () => h('button', { id: 'child-trap-trigger' }, 'Child'),
            default: () => [
              h('input', { id: 'child-trap-first' }),
              h('button', { id: 'child-trap-last' }, 'Last'),
            ],
          },
        )
      const wrapper = render(kind === 'popover' ? ui.NvPopover : ui.NvDialog, {
        slots: {
          reference: () => h('button', { id: 'parent-trap-trigger' }, 'Parent'),
          title: 'Parent',
          default: child,
          footer: child,
        },
      })
      const parent = wrapper.get('#parent-trap-trigger').element as HTMLElement
      parent.focus()
      parent.click()
      await vi.waitFor(() =>
        expect(
          document.activeElement?.closest('[data-part="content"]'),
        ).not.toBeNull(),
      )
      const trigger = document.getElementById('child-trap-trigger')!
      trigger.focus()
      trigger.click()
      await vi.waitFor(() =>
        expect(document.activeElement).toBe(
          document.getElementById('child-trap-first'),
        ),
      )
      const childContent = document.activeElement!.closest(
        '[data-part="content"]',
      )!
      outside.focus()
      await settle()
      expect(childContent.contains(document.activeElement)).toBe(true)
      expect(parent.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      await key(document.activeElement!, 'Escape')
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
      expect(childContent.hasAttribute('inert')).toBe(true)
      expect(parent.getAttribute('aria-expanded')).toBe('true')
      await key(trigger, 'Escape')
      await vi.waitFor(() => expect(document.activeElement).toBe(parent))
    },
  )

  it.each(['popover', 'dialog'])(
    'keeps a nested context menu inside the parent %s trap and dismisses only the menu through its shield',
    async (kind) => {
      const selected = vi.fn()
      const child = () =>
        h(
          ui.NvContextMenu,
          { options: [{ label: 'Run', onClick: selected }] },
          {
            default: () => h('button', { id: 'nested-trap-menu' }, 'Menu'),
          },
        )
      const wrapper = render(kind === 'popover' ? ui.NvPopover : ui.NvDialog, {
        slots: {
          reference: () => h('button', { id: 'menu-parent-trigger' }, 'Parent'),
          title: 'Parent',
          default: child,
          footer: child,
        },
      })
      const parent = wrapper.get('#menu-parent-trigger').element as HTMLElement
      parent.click()
      await vi.waitFor(() =>
        expect(
          document.activeElement?.closest('[data-part="content"]'),
        ).not.toBeNull(),
      )
      const trigger = document.getElementById('nested-trap-menu')!
      trigger.focus()
      await key(trigger, 'ArrowDown')
      const menu = document.querySelector('[role="menu"]') as HTMLElement
      expect(
        menu.closest(`[data-scope="${kind}"][data-part="content"]`),
      ).not.toBeNull()
      await vi.waitFor(() => expect(document.activeElement).toBe(menu))
      const shield = document.querySelector(
        '[data-overlay-shield="context-menu"]',
      )!
      // Let the deferred outside event run after click removes the nested shield.
      for (const type of [
        'pointerdown',
        'mousedown',
        'pointerup',
        'mouseup',
        'click',
      ])
        shield.dispatchEvent(
          new MouseEvent(type, { bubbles: true, cancelable: true }),
        )
      await settle()
      expect(document.querySelector('[role="menu"]')).toBeNull()
      expect(parent.getAttribute('aria-expanded')).toBe('true')
      expect(selected).not.toHaveBeenCalled()
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
    },
  )

  it('popover shield survives pointerdown/up and consumes the dismissal click without activating content below', async () => {
    const activate = vi.fn()
    const wrapper = render({
      render: () =>
        h('section', { onClick: activate }, [
          h('button', { id: 'underlying-action' }, 'Underlying action'),
          h(
            ui.NvPopover,
            {},
            {
              reference: () => h('button', { id: 'popover-trigger' }, 'More'),
              default: () => h('span', 'Popover details'),
            },
          ),
        ]),
    })
    await settle()
    await wrapper.get('#popover-trigger').trigger('click')
    await settle()
    activate.mockClear()
    const shield = document.querySelector(
      '[data-overlay-shield="popover"], .fixed.inset-0.pointer-events-auto',
    ) as HTMLElement
    expect(shield).not.toBeNull()
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
      })
      shield.dispatchEvent(event)
      await settle()
      expect(event.defaultPrevented).toBe(true)
      expect(shield.isConnected).toBe(true)
      expect(
        document.querySelector('[data-scope="popover"][data-part="content"]')
          ?.textContent,
      ).toContain('Popover details')
    }
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    shield.dispatchEvent(click)
    await settle()
    expect(click.defaultPrevented).toBe(true)
    expect(activate).not.toHaveBeenCalled()
    expect(document.querySelector('[data-overlay-shield="popover"]')).toBeNull()
    expect(document.body.textContent).not.toContain('Popover details')
  })

  it.each([
    [{}, '300ms'],
    [{ duration: 120 }, '120ms'],
    [{ duration: [150, 90] }, '150ms'],
    [{ duration: 0 }, '0ms'],
    [{ animation: false }, '0ms'],
  ])(
    'uses the requested tooltip fade duration %j',
    async (options, duration) => {
      const wrapper = render(ui.NvTooltip, {
        props: { tippyOptions: { delay: 0, ...options } },
        slots: {
          reference: () => h('button', 'Help'),
          default: 'Helpful details',
        },
      })
      await settle()
      await wrapper
        .get('button')
        .trigger('pointermove', { pointerType: 'mouse' })
      await settle()
      const positioner = document.querySelector(
        '[data-scope="tooltip"][data-part="positioner"]',
      ) as HTMLElement
      expect(
        positioner.style.getPropertyValue('--nv-tooltip-enter-duration'),
      ).toBe(duration)
    },
  )

  it('dismisses a shared-button tooltip after the pointer leaves its trigger', async () => {
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: [0, 0] } },
      slots: {
        reference: () => h(ui.NvButton, null, () => 'Help'),
        default: 'Helpful details',
      },
    })
    await settle()
    const trigger = wrapper.get('button')
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).not.toBeNull()
    await trigger.trigger('pointerleave', { pointerType: 'mouse' })
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).toBeNull()
  })

  it.each(['native', 'shared'])(
    'dismisses a %s focused-button tooltip on an outside click that leaves focus unchanged',
    async (kind) => {
      const wrapper = render(ui.NvTooltip, {
        props: { tippyOptions: { delay: 0, duration: 0 } },
        slots: {
          reference: () =>
            h(kind === 'shared' ? ui.NvButton : 'button', null, () => 'Help'),
          default: 'Helpful details',
        },
      })
      await settle()
      const trigger = wrapper.get('button').element as HTMLButtonElement
      trigger.focus()
      await wrapper
        .get('button')
        .trigger('pointermove', { pointerType: 'mouse' })
      await settle()
      expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
        'Helpful details',
      )
      const outside = document.createElement('div')
      document.body.append(outside)
      const clicked = vi.fn()
      outside.addEventListener('click', clicked)
      outside.addEventListener('pointerdown', (event) =>
        event.stopPropagation(),
      )
      const event = new MouseEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
      })
      outside.dispatchEvent(event)
      outside.click()
      await settle()
      // Blank surfaces and prevented mouse defaults can leave the button focused.
      expect(document.activeElement).toBe(trigger)
      expect(event.defaultPrevented).toBe(false)
      expect(clicked).toHaveBeenCalledOnce()
      expect(document.querySelector('[role="tooltip"]')).toBeNull()
      await wrapper
        .get('button')
        .trigger('pointermove', { pointerType: 'mouse' })
      await settle()
      expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
        'Helpful details',
      )
    },
  )

  it('cancels a pending tooltip when the pointer leaves before its open delay', async () => {
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: [100, 0] } },
      slots: {
        reference: () => h(ui.NvButton, null, () => 'Help'),
        default: 'Helpful details',
      },
    })
    await settle()
    const trigger = wrapper.get('button')
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await settle()
    await trigger.trigger('pointerleave', { pointerType: 'mouse' })
    await new Promise((resolve) => setTimeout(resolve, 150))
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).toBeNull()
  })

  it('cancels a pending tooltip on an outside click without a pointerleave', async () => {
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: [150, 0] } },
      slots: {
        reference: () => h(ui.NvButton, null, () => 'Help'),
        default: 'Helpful details',
      },
    })
    await settle()
    await wrapper.get('button').trigger('pointermove', { pointerType: 'mouse' })
    document.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true }),
    )
    await new Promise((resolve) => setTimeout(resolve, 200))
    await settle()
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('keeps interactive tooltip content usable when clicked inside its portal', async () => {
    const clicked = vi.fn()
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: 0, duration: 0, interactive: true } },
      slots: {
        reference: () => h(ui.NvButton, null, () => 'Help'),
        default: () =>
          h('button', { id: 'tooltip-action', onClick: clicked }, 'Details'),
      },
    })
    await settle()
    await wrapper.get('button').trigger('pointermove', { pointerType: 'mouse' })
    await settle()
    const action = document.getElementById(
      'tooltip-action',
    ) as HTMLButtonElement
    action.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    action.click()
    await settle()
    expect(clicked).toHaveBeenCalledOnce()
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
  })

  it.each(['sm', 'md', 'lg'])(
    'shows a Select tooltip over the %s indicator and keeps one hover boundary across its text',
    async (size) => {
      const wrapper = render(ui.NvTooltip, {
        props: { tippyOptions: { delay: 0, duration: 0 } },
        slots: {
          reference: () =>
            h(ui.NvSelect, {
              id: `tooltip-select-${size}`,
              'aria-label': 'Speech engine',
              size,
              modelValue: 'a',
              options: [{ label: 'Alpha', value: 'a' }],
            }),
          default: 'Choose a speech engine',
        },
      })
      await settle()
      const control = wrapper.get('[data-nv-select-control]')
      const input = wrapper.get('input')
      // The decorative indicator has pointer-events:none: Chromium hits its
      // containing control, not the input that occupies the text region.
      await control.trigger('pointermove', { pointerType: 'mouse' })
      await settle()
      const tooltip = document.querySelector('[role="tooltip"]')
      expect(tooltip?.textContent).toContain('Choose a speech engine')
      expect(input.attributes('id')).toBe(`tooltip-select-${size}`)
      expect(input.attributes('aria-label')).toBe('Speech engine')
      expect(input.attributes('aria-describedby')).toBe(tooltip?.id)
      await input.trigger('pointermove', { pointerType: 'mouse' })
      input.element.dispatchEvent(
        new MouseEvent('pointerleave', { relatedTarget: control.element }),
      )
      await settle()
      expect(document.querySelector('[role="tooltip"]')).toBe(tooltip)
      control.element.dispatchEvent(
        new MouseEvent('pointerleave', { relatedTarget: document.body }),
      )
      await settle()
      expect(document.querySelector('[role="tooltip"]')).toBeNull()
      await control.trigger('pointermove', { pointerType: 'mouse' })
      await settle()
      expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
      await control.trigger('pointerdown', { pointerType: 'mouse' })
      await control.trigger('click')
      await settle()
      expect(document.querySelector('[role="tooltip"]')).toBeNull()
      expect(document.activeElement).toBe(input.element)
      expect(input.attributes('aria-expanded')).toBe('true')
    },
  )

  it('dismisses tooltips and cancels pending hover opens when the window loses focus', async () => {
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: [80, 0] } },
      slots: {
        reference: () => h(ui.NvButton, null, () => 'Help'),
        default: 'Helpful details',
      },
    })
    await settle()
    const trigger = wrapper.get('button')
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await new Promise((resolve) => setTimeout(resolve, 120))
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).not.toBeNull()
    window.dispatchEvent(new Event('blur'))
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).toBeNull()
    window.dispatchEvent(new Event('focus'))
    await trigger.trigger('pointerleave', { pointerType: 'mouse' })
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    window.dispatchEvent(new Event('blur'))
    await new Promise((resolve) => setTimeout(resolve, 120))
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).toBeNull()
    window.dispatchEvent(new Event('focus'))
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await new Promise((resolve) => setTimeout(resolve, 120))
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).not.toBeNull()
  })

  it('dismisses a tooltip when its document becomes hidden', async () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: [0, 0] } },
      slots: {
        reference: () => h(ui.NvButton, null, () => 'Help'),
        default: 'Helpful details',
      },
    })
    await settle()
    await wrapper.get('button').trigger('pointermove', { pointerType: 'mouse' })
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).not.toBeNull()
    hidden.mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    await settle()
    expect(
      document.querySelector('[data-scope="tooltip"][role="tooltip"]'),
    ).toBeNull()
  })

  it('shows a tooltip when its reference is focused during parent mounting', async () => {
    const Page = defineComponent({
      setup() {
        onMounted(() => document.getElementById('initial-focus-help')?.focus())
        return () =>
          h(
            ui.NvTooltip,
            { tippyOptions: { delay: 0, duration: 0 } },
            {
              reference: () =>
                h(ui.NvButton, { id: 'initial-focus-help' }, () => 'Close'),
              default: () => 'Close panel',
            },
          )
      },
    })
    render(Page)
    await settle()
    expect(document.activeElement?.id).toBe('initial-focus-help')
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Close panel',
    )
    expect(document.activeElement?.getAttribute('aria-describedby')).toBe(
      document.querySelector('[role="tooltip"]')?.id,
    )
  })

  it('shows a tooltip on focus that closes an expanded reference in the same turn', async () => {
    const expanded = ref(true)
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: 0, duration: 0 } },
      slots: {
        reference: () =>
          h(
            ui.NvButton,
            {
              'aria-expanded': expanded.value,
              onFocus: () => {
                expanded.value = false
              },
            },
            () => 'Close',
          ),
        default: 'Close panel',
      },
    })
    await settle()
    const trigger = wrapper.get('button').element as HTMLButtonElement
    trigger.focus()
    await settle()
    expect(document.activeElement).toBe(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Close panel',
    )
  })

  it('reopens on a new programmatic focus after dismissal, without reopening on an unrelated update', async () => {
    const label = ref('Settings')
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: 0, duration: 0 } },
      slots: {
        reference: () => h(ui.NvButton, null, () => label.value),
        default: 'Open settings',
      },
    })
    await settle()
    const trigger = wrapper.get('button').element as HTMLButtonElement
    trigger.focus()
    await settle()
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Open settings',
    )
    document.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true }),
    )
    await settle()
    label.value = 'Updated settings'
    await settle()
    expect(document.activeElement).toBe(trigger)
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    trigger.blur()
    trigger.focus()
    await settle()
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Open settings',
    )
  })

  it('does not let a suppressed tooltip consume Escape from an expanded control', async () => {
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: 0, duration: 0 } },
      slots: {
        reference: () =>
          h(ui.NvButton, { 'aria-expanded': true }, () => 'More'),
        default: 'More options',
      },
    })
    await settle()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    )
    const trigger = wrapper.get('button').element as HTMLButtonElement
    trigger.focus()
    await settle()
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    const escape = vi.fn()
    trigger.addEventListener('keydown', escape)
    await key(trigger, 'Escape')
    expect(escape).toHaveBeenCalledOnce()
  })

  it('dismisses a focused tooltip on blur but keeps interactive content usable', async () => {
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: 0, duration: 0, interactive: true } },
      slots: {
        reference: () => h(ui.NvButton, null, () => 'Help'),
        default: () => h('button', { id: 'focus-tooltip-action' }, 'Details'),
      },
    })
    await settle()
    const trigger = wrapper.get('button').element as HTMLButtonElement
    trigger.focus()
    await settle()
    const action = document.getElementById('focus-tooltip-action')!
    action.focus()
    await settle()
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
    action.blur()
    trigger.focus()
    await settle()
    trigger.blur()
    await settle()
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
  })

  it.each(['outside click', 'blur', 'window blur'])(
    'cancels pending focus activation on %s',
    async (dismissal) => {
      const wrapper = render(ui.NvTooltip, {
        props: { tippyOptions: { delay: 0, duration: 0 } },
        slots: {
          reference: () => h(ui.NvButton, null, () => 'Help'),
          default: 'Helpful details',
        },
      })
      await settle()
      const trigger = wrapper.get('button').element as HTMLButtonElement
      trigger.focus()
      if (dismissal === 'outside click')
        document.body.dispatchEvent(
          new MouseEvent('pointerdown', { bubbles: true }),
        )
      else if (dismissal === 'blur') trigger.blur()
      else window.dispatchEvent(new Event('blur'))
      await settle()
      expect(document.querySelector('[role="tooltip"]')).toBeNull()
    },
  )

  it('passive tooltip opens on hover over a focused reference without creating a click shield', async () => {
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: 0, duration: 0 } },
      slots: {
        reference: () => h('button', 'Help'),
        default: 'Helpful details',
      },
    })
    await settle()
    const trigger = wrapper.get('button').element as HTMLElement
    trigger.dispatchEvent(new MouseEvent('pointerenter', { bubbles: false }))
    trigger.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
    await settle()
    const tooltip = document.querySelector(
      '[data-scope="tooltip"][role="tooltip"]',
    )
    expect(tooltip?.textContent).toContain('Helpful details')
    expect(document.querySelector('[data-overlay-shield]')).toBeNull()
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip?.id)
    await key(trigger, 'Escape')
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    trigger.dispatchEvent(new MouseEvent('pointerleave'))
    trigger.focus()
    await settle()
    trigger.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
    await settle()
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Helpful details',
    )
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(
      document.querySelector('[data-scope="tooltip"][data-part="positioner"]'),
    ).toBeNull()
  })

  it('shows a focused Select tooltip on hover and suppresses it only while its list is open', async () => {
    const wrapper = render(ui.NvTooltip, {
      props: { tippyOptions: { delay: 0, duration: 0 } },
      slots: {
        reference: () =>
          h(ui.NvSelect, {
            id: 'focused-tooltip-select',
            options: [{ label: 'Alpha', value: 'a' }],
            modelValue: 'a',
          }),
        default: 'Choose a voice',
      },
    })
    await settle()
    const input = wrapper.get('input').element as HTMLInputElement
    const control = wrapper.get('[data-nv-select-control]')
    input.focus()
    await settle()
    await control.trigger('pointermove', { pointerType: 'mouse' })
    await settle()
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Choose a voice',
    )
    await key(input, 'Enter')
    await control.trigger('pointermove', { pointerType: 'mouse' })
    await settle()
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    await key(input, 'Escape')
    await control.trigger('pointermove', { pointerType: 'mouse' })
    await settle()
    expect(document.activeElement).toBe(input)
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Choose a voice',
    )
  })

  it.each(['click', 'pointer', 'Space'])(
    'context menu activates one option exactly once through %s',
    async (method) => {
      const selected = vi.fn()
      const blocked = vi.fn()
      const wrapper = render(ui.NvContextMenu, {
        props: {
          options: [
            { label: 'Run', onClick: selected },
            { label: 'Disabled', disabled: true, onClick: blocked },
          ],
        },
        slots: { default: () => h('button', 'Actions') },
      })
      await settle()
      ;(wrapper.get('button').element as HTMLElement).click()
      await settle()
      const menu = document.querySelector('[role="menu"]') as HTMLElement
      const item = menu.querySelector('[role="menuitem"]') as HTMLElement
      if (method === 'Space') {
        await key(menu, 'ArrowDown')
        await key(menu, ' ')
      } else {
        if (method === 'pointer')
          item.dispatchEvent(
            new MouseEvent('pointerdown', { bubbles: true, cancelable: true }),
          )
        ;(item.querySelector('.option__content') as HTMLElement).click()
        await settle()
      }
      expect(selected).toHaveBeenCalledExactlyOnceWith()
      expect(blocked).not.toHaveBeenCalled()
      expect(document.querySelector('[role="menu"]')).toBeNull()
    },
  )

  it('context menu opens with ArrowDown, skips disabled items and invokes the enabled option with Enter', async () => {
    const blocked = vi.fn()
    const selected = vi.fn()
    const wrapper = render(ui.NvContextMenu, {
      props: {
        options: [
          { label: 'Disabled', disabled: true, onClick: blocked },
          { type: 'divider' },
          { label: 'Run', onClick: selected },
        ],
      },
      slots: { default: () => h('button', 'Actions') },
    })
    await settle()
    const trigger = wrapper.get('button').element as HTMLButtonElement
    trigger.focus()
    await key(trigger, 'ArrowDown')
    const menu = document.querySelector('[role="menu"]') as HTMLElement
    expect(menu).not.toBeNull()
    expect(menu.querySelectorAll('[role="menuitem"]')).toHaveLength(2)
    expect(menu.querySelector('[data-highlighted]')?.textContent).toContain(
      'Run',
    )
    await key(menu, 'Enter')
    expect(selected).toHaveBeenCalledExactlyOnceWith()
    expect(blocked).not.toHaveBeenCalled()
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})
