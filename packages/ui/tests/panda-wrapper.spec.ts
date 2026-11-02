// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { pandaComponent } from '../src/utils/panda'

describe('Panda Vue wrappers', () => {
  it('forwards native attrs, refs, slots and model input without leaking styling props', async () => {
    const Control = pandaComponent(
      'input',
      { size: { default: 'md' }, modelValue: String },
      () => 'recipe',
    )
    const w = mount(Control, {
      props: { modelValue: 'one' },
      attrs: { id: 'field', disabled: true, class: 'consumer' },
    })
    expect(w.classes().sort()).toEqual(['consumer', 'recipe'])
    expect(w.attributes('size')).toBeUndefined()
    expect(w.get('input').element.disabled).toBe(true)
    expect(w.get('input').element.value).toBe('one')
    await w.setValue('two')
    expect(w.emitted('update:modelValue')).toEqual([['two']])
    w.unmount()
  })
  it('updates inherited theme variables and supports a native element override', async () => {
    const theme = ref({ text: { color: '#123456' } })
    const Group = pandaComponent(
      'div',
      { as: { default: 'div' } },
      () => 'group',
    )
    const w = mount(Group, {
      props: { as: 'section' },
      slots: { default: 'Content' },
      global: { provide: { theme } },
    })
    expect(w.element.tagName).toBe('SECTION')
    expect(w.text()).toBe('Content')
    expect(
      (w.element as HTMLElement).style.getPropertyValue('--nv-text-color'),
    ).toBe('#123456')
    theme.value = { text: { color: '#abcdef' } }
    await nextTick()
    expect(
      (w.element as HTMLElement).style.getPropertyValue('--nv-text-color'),
    ).toBe('#abcdef')
    w.unmount()
  })
})
