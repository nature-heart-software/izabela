// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
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
      provide: { theme: ui.themes.get('izabela-dark') },
      ...options.global,
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
})

describe('basic form migration', () => {
  it.each([
    ['Button', 'button'],
    ['Input', 'input'],
    ['NumberInput', 'number-input'],
    ['Textarea', 'textarea'],
    ['Switch', 'switch'],
    ['RangeInput', 'range-input'],
    ['Tag', 'tag'],
  ])(
    '%s owns an extracted Panda recipe instead of a styled-components module',
    (directory, stem) => {
      const base = resolve(root, 'packages/ui/src/components/forms', directory)
      expect(existsSync(resolve(base, `${stem}.styled.ts`))).toBe(false)
      expect(readFileSync(resolve(base, `${stem}.panda.ts`), 'utf8')).toContain(
        '@/styled-system/css',
      )
      expect(
        readFileSync(resolve(base, `Nv${directory}.vue`), 'utf8'),
      ).not.toMatch(/element-plus|\.styled/)
    },
  )
  it('preserves the numeric range-update contract and native bounds', async () => {
    const w = render(ui.NvRangeInput, {
      props: { modelValue: 2 },
      attrs: { min: 0, max: 10, step: 0.5, 'aria-label': 'Volume' },
    })
    expect((w.element as HTMLInputElement).type).toBe('range')
    expect((w.element as HTMLInputElement).value).toBe('2')
    await w.get('input').setValue('4.5')
    expect(w.emitted('update:modelValue')).toEqual([[4.5]])
    await w.setProps({ modelValue: 8, disabled: true })
    expect((w.element as HTMLInputElement).value).toBe('8')
    expect((w.element as HTMLInputElement).step).toBe('0.5')
    expect((w.element as HTMLInputElement).disabled).toBe(true)
  })
  it('keeps textarea models, native attrs, and exposed input', async () => {
    const w = render(ui.NvTextarea, {
      props: { modelValue: 'before' },
      attrs: { rows: 3, 'aria-label': 'Message' },
    })
    await w.setValue('after')
    expect(w.emitted('update:modelValue')).toEqual([['after']])
    expect((w.vm as any).input).toBe(w.element)
    expect(w.attributes('rows')).toBe('3')
    await w.setProps({ modelValue: 'parent', readonly: true })
    expect((w.element as HTMLTextAreaElement).value).toBe('parent')
    expect((w.element as HTMLTextAreaElement).readOnly).toBe(true)
  })
  it('keeps tag close events on its real button', async () => {
    const w = render(ui.NvTag, {
      props: { closable: true },
      slots: { default: 'Selected' },
    })
    expect(w.get('button').attributes('aria-label')).toBe('Remove tag')
    await w.get('button').trigger('click')
    expect(w.emitted('close')).toEqual([[]])
    expect(w.text()).toContain('Selected')
  })
  it.each([
    [ui.NvInput, 'text'],
    [ui.NvNumberInput, 'number'],
  ])(
    'preserves native %s input values, attrs, events and exposed input',
    async (component, type) => {
      const w = render(component, {
        props: { modelValue: '12' },
        attrs: {
          id: 'value',
          type,
          min: -1,
          max: 20,
          step: 0.5,
          placeholder: 'Value',
          'aria-label': 'Value',
          readonly: true,
        },
      })
      const input = w.get('input')
      expect((input.element as HTMLInputElement).type).toBe(type)
      expect((input.element as HTMLInputElement).value).toBe('12')
      expect(input.attributes('id')).toBe('value')
      expect(input.attributes('aria-label')).toBe('Value')
      expect((input.element as HTMLInputElement).readOnly).toBe(true)
      await input.setValue('3.5')
      expect(
        w.emitted('update:model-value') ?? w.emitted('update:modelValue'),
      ).toEqual([['3.5']])
      await w.setProps({ modelValue: '7' })
      expect((input.element as HTMLInputElement).value).toBe('7')
      expect((w.vm as any).input).toBe(input.element)
      ;(input.element as HTMLElement).focus()
      expect(w.emitted('focus')).toHaveLength(1)
      ;(input.element as HTMLElement).blur()
      expect(w.emitted('blur')).toHaveLength(1)
      await w.setProps({ disabled: true })
      await flushPromises()
      expect((input.element as HTMLInputElement).disabled).toBe(true)
      expect(w.find('.el-input').exists()).toBe(false)
    },
  )
  it('commits IME text only when composition completes', async () => {
    const w = render(ui.NvInput, { props: { modelValue: '' } })
    const input = w.get('input')
    await input.trigger('compositionstart')
    ;(input.element as HTMLInputElement).value = '日本'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await input.trigger('compositionend')
    expect(w.emitted('update:modelValue')).toEqual([['日本']])
  })
  it('clears to a string and does not offer clearing readonly or disabled values', async () => {
    const w = render(ui.NvInput, {
      props: { modelValue: 'Value', clearable: true },
    })
    await w.get('button[aria-label="Clear input"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['']])
    expect(w.emitted('clear')).toEqual([[]])
    await w.setProps({ readonly: true })
    expect(w.find('button[aria-label="Clear input"]').exists()).toBe(false)
    await w.setProps({ readonly: false, disabled: true })
    expect(w.find('button[aria-label="Clear input"]').exists()).toBe(false)
  })
  it('retains the password reveal action used by API key fields', async () => {
    const w = render(ui.NvInput, {
      props: { modelValue: 'secret' },
      attrs: { type: 'password', 'show-password': true },
    })
    const input = w.get('input')
    expect((input.element as HTMLInputElement).type).toBe('password')
    await w.get('button[aria-label="Show password"]').trigger('click')
    expect((input.element as HTMLInputElement).type).toBe('text')
    await w.get('button[aria-label="Hide password"]').trigger('click')
    expect((input.element as HTMLInputElement).type).toBe('password')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
  it('keeps prepend, append, prefix, suffix and default content', () => {
    const w = render(ui.NvInput, {
      slots: Object.fromEntries(
        ['prepend', 'append', 'prefix', 'suffix', 'default'].map((name) => [
          name,
          () => h('span', name),
        ]),
      ),
    })
    for (const name of ['prepend', 'append', 'prefix', 'suffix', 'default'])
      expect(w.text()).toContain(name)
  })
  it('uses a named native switch, tracks external state and respects disabled and readonly', async () => {
    const w = render(ui.NvSwitch, {
      props: { modelValue: false },
      attrs: { 'aria-label': 'Enabled', name: 'enabled', id: 'enabled' },
    })
    const input = w.get('input[role="switch"]')
    expect(input.attributes('aria-label')).toBe('Enabled')
    expect(input.attributes('id')).toBe('enabled')
    expect((input.element as HTMLInputElement).checked).toBe(false)
    ;(input.element as HTMLInputElement).focus()
    expect(document.activeElement).toBe(input.element)
    ;(input.element as HTMLInputElement).click()
    await nextTick()
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    await w.setProps({ modelValue: true })
    expect((input.element as HTMLInputElement).checked).toBe(true)
    await w.setProps({ disabled: true })
    await flushPromises()
    expect((input.element as HTMLInputElement).disabled).toBe(true)
    ;(input.element as HTMLInputElement).click()
    expect(w.emitted('update:modelValue')).toHaveLength(1)
    await w.setProps({ disabled: false, readonly: true })
    await flushPromises()
    ;(input.element as HTMLInputElement).click()
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })
  it('announces pending without disabling button clicks or relying on a directive', async () => {
    const w = render(ui.NvButton, {
      props: { loading: true },
      slots: { default: 'Save' },
    })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.get('[role="status"]').attributes('aria-label')).toBe('Loading')
    expect(w.find('.el-loading-mask').exists()).toBe(false)
    expect((w.element as HTMLButtonElement).disabled).toBe(false)
    ;(w.element as HTMLButtonElement).click()
    expect(w.emitted('click')).toHaveLength(1)
    await w.setProps({ loading: false, disabled: true })
    expect(w.find('[role="status"]').exists()).toBe(false)
    ;(w.element as HTMLButtonElement).click()
    expect(w.emitted('click')).toHaveLength(1)
  })
})
