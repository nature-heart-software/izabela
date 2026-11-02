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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('overlay interaction boundaries', () => {
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
