// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineAsyncComponent, defineComponent, h, nextTick, ref } from 'vue'
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
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
async function settle() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 50))
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
    x: 20,
    y: 30,
    top: 30,
    left: 20,
    right: 220,
    bottom: 70,
    width: 200,
    height: 40,
    toJSON() {
      return {}
    },
  }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    rect,
  ] as any)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)
})
afterEach(async () => {
  await settle()
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  await settle()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('overlay trigger ownership', () => {
  it.each(['popover', 'dialog'])(
    '%s uses the native button inside a tooltip as its single trigger and focus-return target',
    async (kind) => {
      const click = vi.fn((event: MouseEvent) => {
        if (event.ctrlKey) event.preventDefault()
      })
      const wrapper = render(kind === 'dialog' ? ui.NvDialog : ui.NvPopover, {
        slots: {
          reference: () =>
            h(
              ui.NvTooltip,
              {},
              {
                reference: () =>
                  h(
                    ui.NvButton,
                    { id: 'tooltip-owned-button', onClick: click },
                    () => 'Open',
                  ),
                default: () => 'More settings',
              },
            ),
          title: 'Settings',
          default: () => h('input', { id: 'popover-control' }),
          footer: () => h('input', { id: 'dialog-control' }),
        },
      })
      await settle()
      const button = wrapper.get('#tooltip-owned-button')
        .element as HTMLButtonElement
      expect(
        wrapper
          .findAll('button, [tabindex]')
          .filter((node) => (node.element as HTMLElement).tabIndex >= 0),
      ).toHaveLength(1)
      expect(
        wrapper.get(`[data-scope="${kind}"][data-part="trigger"]`).element,
      ).toBe(button)
      button.focus()
      button.dispatchEvent(
        new MouseEvent('click', {
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      )
      await settle()
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(click).toHaveBeenCalledOnce()
      click.mockClear()
      button.click()
      await settle()
      expect(click).toHaveBeenCalledOnce()
      const field = document.getElementById(`${kind}-control`)!
      expect(field).not.toBeNull()
      if (kind === 'popover') expect(document.activeElement).toBe(field)
      else
        await vi.waitFor(() =>
          expect(
            document.activeElement?.closest('[role="dialog"]'),
          ).not.toBeNull(),
        )
      await key(field, 'Escape')
      await vi.waitFor(() => expect(document.activeElement).toBe(button))
    },
  )

  it.each(['custom', 'generated'])(
    'retargets a lazy-loaded voice control and its replacement with a %s input ID',
    async (kind) => {
      const active = ref(0)
      const releases: ((component: any) => void)[] = []
      const references = [0, 1].map((index) =>
        defineAsyncComponent(
          () =>
            new Promise<any>((resolve) => {
              releases[index] = resolve
            }),
        ),
      )
      const wrapper = render(ui.NvTooltip, {
        props: { tippyOptions: { delay: 0, duration: 0, placement: 'top' } },
        slots: {
          reference: () =>
            h(references[active.value], {
              ...(kind === 'custom' ? { id: 'lazy-voice-input' } : {}),
              'aria-label': 'Speech voice',
              options: [{ label: 'Alpha', value: 'a' }],
              modelValue: 'a',
            }),
          default: 'Speech engine voice',
        },
      })
      let previousControlId = ''
      for (const index of [0, 1]) {
        active.value = index
        await settle()
        expect(wrapper.find('input').exists()).toBe(false)
        releases[index](ui.NvSelect)
        await settle()
        const control = wrapper.get('[data-nv-select-control]')
          .element as HTMLElement
        const input = wrapper.get('input').element as HTMLInputElement
        vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(
          new DOMRect(20, 30, 320, 48),
        )
        vi.spyOn(input, 'getBoundingClientRect').mockReturnValue(
          new DOMRect(40, 38, 260, 24),
        )
        control.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
        await settle()
        await vi.waitFor(() =>
          expect(
            (
              document.querySelector(
                '[data-scope="tooltip"][data-part="positioner"]',
              ) as HTMLElement
            )?.style.getPropertyValue('--reference-width'),
          ).toBe('320px'),
        )
        expect(control.id).not.toBe(previousControlId)
        previousControlId = control.id
        expect(input.id).not.toBe(control.id)
        if (kind === 'custom') expect(input.id).toBe('lazy-voice-input')
        expect(input.getAttribute('aria-describedby')).toBe(
          document.querySelector('[role="tooltip"]')?.id,
        )
        control.dispatchEvent(new MouseEvent('pointerleave'))
        await settle()
      }
      wrapper.unmount()
      await settle()
      expect(document.querySelector('[role="tooltip"]')).toBeNull()
    },
  )

  it.each(['custom', 'generated'])(
    'Select tooltip measures its complete control with a %s input ID',
    async (kind) => {
      const wrapper = render(ui.NvTooltip, {
        props: { tippyOptions: { delay: 0, placement: 'top' } },
        slots: {
          reference: () =>
            h(ui.NvSelect, {
              ...(kind === 'custom' ? { id: 'consumer-select-input' } : {}),
              'aria-label': 'Speech engine',
              options: [{ label: 'Alpha', value: 'a' }],
              modelValue: 'a',
            }),
          default: 'Choose a speech engine',
        },
      })
      await settle()
      const control = wrapper.get('[data-nv-select-control]')
        .element as HTMLElement
      const input = wrapper.get('input').element as HTMLInputElement
      vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(20, 30, 320, 48),
      )
      vi.spyOn(input, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(40, 38, 260, 24),
      )
      control.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
      await settle()
      const positioner = document.querySelector(
        '[data-scope="tooltip"][data-part="positioner"]',
      ) as HTMLElement
      expect(positioner).not.toBeNull()
      await vi.waitFor(() =>
        expect(positioner.style.getPropertyValue('--reference-width')).toBe(
          '320px',
        ),
      )
      expect(
        wrapper.get('[data-scope="tooltip"][data-part="trigger"]').element,
      ).toBe(control)
      expect(control.id).not.toBe('')
      expect(input.id).not.toBe(control.id)
      if (kind === 'custom') expect(input.id).toBe('consumer-select-input')
      expect(document.getElementById(input.id)).toBe(input)
      expect(input.getAttribute('aria-label')).toBe('Speech engine')
      expect(input.getAttribute('aria-describedby')).toBe(
        document.querySelector('[role="tooltip"]')?.id,
      )
      expect(
        new Set(
          [...wrapper.element.querySelectorAll('[id]')].map(
            (element) => element.id,
          ),
        ).size,
      ).toBe(wrapper.element.querySelectorAll('[id]').length)
    },
  )

  it.each(['native', 'shared', 'custom', 'generated'])(
    'menu restores focus to its actual %s trigger after nested Escape',
    async (kind) => {
      const custom = defineComponent({
        setup: () => () => h('button', 'Actions'),
      })
      const selected = vi.fn()
      const blocked = vi.fn()
      const wrapper = render(ui.NvDialog, {
        slots: {
          reference: () => 'Open parent',
          title: 'Parent',
          footer: () =>
            h(
              ui.NvPopover,
              {},
              {
                reference: () => h('button', 'More'),
                default: () =>
                  h(
                    ui.NvContextMenu,
                    {
                      options: [
                        { label: 'Blocked', disabled: true, onClick: blocked },
                        { label: 'Run', onClick: selected },
                      ],
                    },
                    {
                      default: () =>
                        kind === 'custom'
                          ? h(custom, { id: 'consumer-menu-trigger' })
                          : h(
                              kind === 'shared' ? ui.NvButton : 'button',
                              kind === 'generated'
                                ? {}
                                : { id: 'consumer-menu-trigger' },
                              kind === 'shared' ? () => 'Actions' : 'Actions',
                            ),
                    },
                  ),
              },
            ),
        },
      })
      await settle()
      ;(
        wrapper.get('[data-scope="dialog"][data-part="trigger"]')
          .element as HTMLElement
      ).click()
      await settle()
      ;(
        document.querySelector(
          '[data-scope="popover"][data-part="trigger"]',
        ) as HTMLElement
      ).click()
      await settle()
      const trigger = document.querySelector(
        '[data-scope="menu"][data-part="trigger"]',
      ) as HTMLElement
      const triggerId = trigger.id
      expect(triggerId).toBeTruthy()
      if (kind !== 'generated') expect(triggerId).toBe('consumer-menu-trigger')
      trigger.focus()
      await key(trigger, 'ArrowDown')
      const menu = document.querySelector('[role="menu"]') as HTMLElement
      expect(menu).not.toBeNull()
      expect(
        menu.closest('[data-part="positioner"]')?.getAttribute('style'),
      ).toContain('--reference-width: 200px')
      expect(menu.closest('[role="dialog"]')).not.toBeNull()
      expect(menu.querySelector('[data-highlighted]')?.textContent).toContain(
        'Run',
      )
      menu.focus()
      await settle()
      await key(menu, 'Escape')
      expect(document.querySelector('[role="menu"]')).toBeNull()
      expect(document.querySelector('[role="dialog"]')).not.toBeNull()
      expect(
        document.querySelector('[data-scope="popover"][data-part="content"]'),
      ).not.toBeNull()
      expect(
        document.activeElement === trigger,
        `active element: ${document.activeElement?.tagName}#${document.activeElement?.id}`,
      ).toBe(true)
      expect(trigger.id).toBe(triggerId)
      expect(selected).not.toHaveBeenCalled()
      expect(blocked).not.toHaveBeenCalled()
      await key(trigger, 'ArrowDown')
      ;(document.querySelector('[role="menu"]') as HTMLElement).focus()
      await settle()
      await key(document.querySelector('[role="menu"]')!, 'Enter')
      expect(selected).toHaveBeenCalledExactlyOnceWith()
      expect(blocked).not.toHaveBeenCalled()
      expect(
        document.activeElement === trigger,
        `active element: ${document.activeElement?.tagName}#${document.activeElement?.id}`,
      ).toBe(true)
    },
  )

  it.each(['native', 'span', 'shared', 'custom', 'text'])(
    'dialog has a single %s reference owner',
    async (kind) => {
      const custom = defineComponent({
        setup: () => () => h('button', 'Open custom'),
      })
      const reference = () =>
        kind === 'text'
          ? 'Open text'
          : kind === 'shared'
          ? h(ui.NvButton, { id: 'dialog-reference' }, () => 'Open shared')
          : h(
              (kind === 'custom'
                ? custom
                : kind === 'span'
                ? 'span'
                : 'button') as any,
              { id: 'dialog-reference' },
              kind === 'custom' ? undefined : 'Open reference',
            )
      const wrapper = render(ui.NvDialog, {
        slots: { reference, title: 'Example' },
      })
      await settle()
      const trigger = wrapper.get('[data-scope="dialog"][data-part="trigger"]')
        .element as HTMLElement
      if (kind === 'text') expect(trigger.tagName).toBe('BUTTON')
      else {
        expect(trigger.id).toBe('dialog-reference')
        expect(trigger.tagName).toBe(kind === 'span' ? 'SPAN' : 'BUTTON')
      }
      expect(
        wrapper.findAll(
          'button button, button a, button input, [role="button"] button',
        ),
      ).toHaveLength(0)
      expect(trigger.querySelector('button')).toBeNull()
      trigger.focus()
      trigger.click()
      await settle()
      expect(
        document.querySelector('[data-scope="dialog"][role="dialog"]'),
      ).not.toBeNull()
      await key(document.activeElement!, 'Escape')
      expect(
        document.querySelector('[data-scope="dialog"][role="dialog"]'),
      ).toBeNull()
      expect(document.activeElement === trigger).toBe(true)
    },
  )

  it.each(['native', 'shared', 'custom'])(
    'disabled %s dialog reference has no independent focusable owner',
    async (kind) => {
      const custom = defineComponent({
        props: { disabled: Boolean },
        setup: (props) => () =>
          h('button', { disabled: props.disabled }, 'Unavailable'),
      })
      const wrapper = render(ui.NvDialog, {
        slots: {
          reference: () =>
            h(
              kind === 'shared'
                ? ui.NvButton
                : kind === 'custom'
                ? custom
                : 'button',
              { id: 'disabled-reference', disabled: true },
              kind === 'shared' ? () => 'Unavailable' : undefined,
            ),
          title: 'Must remain closed',
        },
      })
      await settle()
      const triggers = wrapper.findAll(
        '[data-scope="dialog"][data-part="trigger"]',
      )
      expect(triggers).toHaveLength(1)
      const trigger = triggers[0].element as HTMLButtonElement
      expect(trigger.id).toBe('disabled-reference')
      expect(trigger.disabled).toBe(true)
      expect(wrapper.findAll('button')).toHaveLength(1)
      trigger.focus()
      expect(document.activeElement === trigger).toBe(false)
      trigger.click()
      await settle()
      expect(
        document.querySelector('[data-scope="dialog"][role="dialog"]'),
      ).toBeNull()
    },
  )

  it.each(['Enter', ' '])(
    'span reference activates with %s through the single Ark owner',
    async (activation) => {
      const wrapper = render(ui.NvDialog, {
        slots: {
          reference: () => h('span', { id: 'span-reference' }, 'Open'),
          title: 'Keyboard dialog',
        },
      })
      await settle()
      const trigger = wrapper.get('#span-reference').element as HTMLElement
      expect(trigger.getAttribute('role')).toBe('button')
      expect(trigger.tabIndex).toBe(0)
      trigger.focus()
      await key(trigger, activation)
      trigger.dispatchEvent(
        new KeyboardEvent('keyup', {
          key: activation,
          bubbles: true,
          cancelable: true,
        }),
      )
      await settle()
      expect(
        document.querySelector('[data-scope="dialog"][role="dialog"]'),
      ).not.toBeNull()
      await key(document.activeElement!, 'Escape')
      expect(document.activeElement === trigger).toBe(true)
    },
  )

  it('reenabled shared reference remains the single activatable trigger', async () => {
    const disabled = ref(true)
    const wrapper = render(ui.NvDialog, {
      slots: {
        reference: () =>
          h(
            ui.NvButton,
            { id: 'changing-reference', disabled: disabled.value },
            () => 'Open',
          ),
        title: 'Enabled dialog',
      },
    })
    await settle()
    disabled.value = false
    await settle()
    const trigger = wrapper.get('#changing-reference')
      .element as HTMLButtonElement
    expect(trigger.disabled).toBe(false)
    trigger.focus()
    trigger.click()
    await settle()
    expect(
      document.querySelector('[data-scope="dialog"][role="dialog"]'),
    ).not.toBeNull()
  })

  it.each([
    'popover-native',
    'popover-shared',
    'tooltip-native',
    'tooltip-shared',
  ])(
    '%s uses the consumer trigger bounds instead of a missing generated anchor',
    async (kind) => {
      const tooltip = kind.startsWith('tooltip')
      const shared = kind.endsWith('shared')
      const scope = tooltip ? 'tooltip' : 'popover'
      const wrapper = render(tooltip ? ui.NvTooltip : ui.NvPopover, {
        props: tooltip
          ? { tippyOptions: { delay: 0, placement: 'bottom' } }
          : { placement: 'bottom' },
        slots: {
          reference: () =>
            h(
              shared ? ui.NvButton : 'button',
              { id: 'consumer-anchor' },
              shared ? () => 'Anchor' : 'Anchor',
            ),
          default: 'Anchored content',
        },
      })
      await settle()
      const trigger = wrapper.get('#consumer-anchor').element as HTMLElement
      expect(trigger.getAttribute('data-part')).toBe('trigger')
      expect(wrapper.findAll('[data-part="trigger"]')).toHaveLength(1)
      if (tooltip) {
        trigger.dispatchEvent(
          new MouseEvent('pointerenter', { bubbles: false }),
        )
        trigger.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
      } else trigger.click()
      await settle()
      const positioner = document.querySelector(
        `[data-scope="${scope}"][data-part="positioner"]`,
      ) as HTMLElement
      expect(positioner).not.toBeNull()
      expect(positioner.style.getPropertyValue('--reference-width')).toBe(
        '200px',
      )
      expect(positioner.style.position).toBe('absolute')
      expect(trigger.id).toBe('consumer-anchor')
      await key(
        tooltip
          ? trigger
          : document.querySelector(
              '[data-scope="popover"][data-part="content"]',
            )!,
        'Escape',
      )
      if (!tooltip) expect(document.activeElement === trigger).toBe(true)
    },
  )
})
