// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
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
async function key(target: Element, key: string) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
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

  it('passive tooltip uses Ark hover/Escape behavior without creating a click shield and suppresses focused references', async () => {
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
    trigger.focus()
    await settle()
    trigger.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
    await settle()
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(
      document.querySelector('[data-scope="tooltip"][data-part="positioner"]'),
    ).toBeNull()
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
