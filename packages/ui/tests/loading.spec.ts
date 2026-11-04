// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
execFileSync(
  process.execPath,
  [resolve(dirname(fileURLToPath(import.meta.url)), 'build-client.mjs')],
  { stdio: 'pipe' },
)
const clientPath = '../../../coverage/ui-client/test-client.js'
const { loadingDirective, NvSelect, NvButton, PORTAL_TARGET } = await import(
  /* @vite-ignore */ clientPath
)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('loading directive', () => {
  it('shows a busy status without disabling the host and cleans up on completion', async () => {
    const Host = defineComponent({
      props: { busy: Boolean },
      setup: (props) => () =>
        withDirectives(h('button', 'Save'), [[loadingDirective, props.busy]]),
    })
    const w = mount(Host, { props: { busy: false } })
    expect(w.find('[role="status"]').exists()).toBe(false)
    await w.setProps({ busy: true })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.get('[role="status"]').attributes('aria-label')).toBe('Loading')
    expect((w.element as HTMLButtonElement).disabled).toBe(false)
    await w.setProps({ busy: false })
    expect(w.find('[role="status"]').exists()).toBe(false)
    expect(w.attributes('aria-busy')).toBeUndefined()
    w.unmount()
  })

  it('keeps a select mask inside the bordered control and realigns it on resize', async () => {
    let width = 200
    let resize: () => void = () => {}
    const disconnected = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback
        }
        observe() {}
        disconnect = disconnected
      },
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function () {
        const w = this.hasAttribute('data-nv-loading-target') ? width : 200
        return {
          x: 20,
          y: 10,
          left: 20,
          top: 10,
          right: 20 + w,
          bottom: 50,
          width: w,
          height: 40,
          toJSON() {},
        }
      },
    )
    const Host = defineComponent({
      props: { busy: Boolean },
      setup: (props) => () =>
        withDirectives(h(NvSelect, { options: [] }), [
          [loadingDirective, props.busy],
        ]),
    })
    const w = mount(Host, {
      attachTo: document.body,
      props: { busy: false },
      global: { provide: { [PORTAL_TARGET]: document.body } },
    })
    try {
      const control = w.get('[data-nv-select-control]').element as HTMLElement
      control.style.border = '2px solid red'
      Object.assign(control.style, {
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
      })
      await w.setProps({ busy: true })
      const mask = w.get('[role=status]').element as HTMLElement
      expect(mask.parentElement).toBe(w.element)
      expect([
        mask.style.top,
        mask.style.right,
        mask.style.bottom,
        mask.style.left,
      ]).toEqual(['2px', '2px', '2px', '2px'])
      expect(parseFloat(mask.style.borderTopLeftRadius)).toBe(10)
      width = 240
      resize()
      expect(mask.style.right).toBe('42px')
      await w.setProps({ busy: false })
      expect(w.find('[role=status]').exists()).toBe(false)
      expect(w.attributes('aria-busy')).toBeUndefined()
      expect(disconnected).toHaveBeenCalledOnce()
    } finally {
      w.unmount()
      w.element.remove()
    }
  })

  it('uses the inner corner radius for a bordered button without disabling it', () => {
    const Host = defineComponent({
      setup: () => () =>
        withDirectives(
          h(
            NvButton,
            { style: { border: '2px solid red', borderTopLeftRadius: '12px' } },
            () => 'Save',
          ),
          [[loadingDirective, true]],
        ),
    })
    const w = mount(Host, { attachTo: document.body })
    try {
      const mask = w.get('[role=status]').element as HTMLElement
      expect(parseFloat(mask.style.borderTopLeftRadius)).toBe(10)
      expect((w.element as HTMLButtonElement).disabled).toBe(false)
    } finally {
      w.unmount()
      w.element.remove()
    }
  })
})
