// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  createSSRApp,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  ref,
} from 'vue'
import { renderToString } from 'vue/server-renderer'
import { pandaComponent, themeVariables } from '../src/utils/panda'
import light from '../src/themes/light'

describe('Panda Vue wrappers', () => {
  it('keeps unchanged theme styles through highlight and content updates', async () => {
    const Surface = pandaComponent('div', { active: Boolean }, (props) =>
      props.active ? 'active' : '',
    )
    const text = ref('First voice')
    const wrapper = mount(Surface, {
      slots: { default: () => text.value },
      global: { provide: { theme: light } },
    })
    const cssText = vi.spyOn(CSSStyleDeclaration.prototype, 'cssText', 'set')
    try {
      await wrapper.setProps({ active: true })
      text.value = 'Next voice'
      await nextTick()
      expect(wrapper.classes()).toContain('active')
      expect(wrapper.text()).toBe('Next voice')
      expect(cssText).not.toHaveBeenCalled()
      await wrapper.setProps({ style: { width: '200px' } })
      const element = wrapper.element as HTMLElement
      expect(element.style.width).toBe('200px')
      for (const [key, value] of Object.entries(themeVariables(light)))
        expect(element.style.getPropertyValue(key)).toBe(value)
    } finally {
      wrapper.unmount()
      cssText.mockRestore()
    }
  })

  it('keeps bulk theme application after component fallthrough and primitive style updates', async () => {
    const width = ref('100px')
    const Primitive = defineComponent({
      inheritAttrs: false,
      setup:
        (_, { attrs }) =>
        () =>
          h('aside', mergeProps({ style: { width: width.value } }, attrs)),
    })
    const Surface = pandaComponent(Primitive)
    const setProperty = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty')
    const wrapper = mount(Surface, { global: { provide: { theme: light } } })
    try {
      const element = wrapper.get('aside').element as HTMLElement
      const expected = themeVariables(light)
      expect(element.style.width).toBe('100px')
      width.value = '200px'
      await nextTick()
      expect(element.style.width).toBe('200px')
      for (const [key, value] of Object.entries(expected))
        expect(element.style.getPropertyValue(key)).toBe(value)
      expect(
        setProperty.mock.calls.filter(([key]) => key.startsWith('--nv-')),
      ).toHaveLength(0)
    } finally {
      wrapper.unmount()
      setProperty.mockRestore()
    }
  })
  it('retains scoped variables in actual server-rendered markup', async () => {
    const Surface = pandaComponent('aside')
    const app = createSSRApp({
      setup: () => () =>
        h(Surface, { style: { color: 'red' } }, () => 'Content'),
    })
    app.provide('theme', { text: { color: '#123456' } })
    const html = await renderToString(app)
    expect(html).toContain('data-nv-theme')
    expect(html).toContain('--nv-text-color:#123456')
    expect(html).toContain('color:red')
    expect(html).toContain('Content')
  })
  it.each(['literal; --unexpected: yes', '/* literal', '"unterminated'])(
    'keeps non-simple theme value %s on the property-safe path',
    (value) => {
      const Surface = pandaComponent('div')
      const wrapper = mount(Surface, {
        global: {
          provide: { theme: { text: { color: value } } },
        },
      })
      try {
        const style = (wrapper.element as HTMLElement).style
        expect(style.getPropertyValue('--nv-text-color')).toBe(value)
        expect(style.getPropertyValue('--unexpected')).toBe('')
      } finally {
        wrapper.unmount()
      }
    },
  )
  it.each(['literal; --unexpected: yes', '/* literal', '"unterminated'])(
    'preserves retained consumer literal %s through live updates',
    async (literal) => {
      const theme = ref({ text: { color: 'right' } })
      const wrapper = mount(pandaComponent('div'), {
        attrs: { style: { '--consumer': literal, color: 'red' } },
        global: { provide: { theme } },
      })
      try {
        const style = (wrapper.element as HTMLElement).style
        const check = (consumer: string, color: string) => {
          expect(style.getPropertyValue('--consumer')).toBe(consumer)
          expect(style.getPropertyValue('--unexpected')).toBe('')
          expect(style.getPropertyValue('--nv-text-color')).toBe(color)
          expect(style.color).toBe('red')
          expect(style.length).toBe(3)
        }
        check(literal, 'right')
        theme.value = { text: { color: 'updated' } }
        await nextTick()
        check(literal, 'updated')
        await wrapper.setProps({
          style: { '--consumer': `${literal} next`, color: 'red' },
        })
        check(`${literal} next`, 'updated')
      } finally {
        wrapper.unmount()
      }
    },
  )
  it('applies the complete canonical theme in bulk rather than one DOM mutation per token', async () => {
    const Surface = pandaComponent('div')
    const theme = ref<Record<string, unknown>>(light)
    const setProperty = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty')
    const wrapper = mount(Surface, { global: { provide: { theme } } })
    try {
      const style = (wrapper.element as HTMLElement).style
      const expected = themeVariables(light)
      expect(Object.keys(expected).length).toBeGreaterThan(600)
      for (const [key, value] of Object.entries(expected))
        expect(style.getPropertyValue(key)).toBe(value)
      expect(
        setProperty.mock.calls.filter(([key]) => key.startsWith('--nv-')),
      ).toHaveLength(0)
      theme.value = { text: { body: { foreground: '#abcdef' } } }
      await nextTick()
      expect(style.getPropertyValue('--nv-text-body-foreground')).toBe(
        '#abcdef',
      )
      expect(style.length).toBe(1)
    } finally {
      wrapper.unmount()
      setProperty.mockRestore()
    }
  })
  it('preserves consumer style merging and theme-variable precedence', async () => {
    const Surface = pandaComponent('div')
    const wrapper = mount(Surface, {
      attrs: {
        style: [
          'margin-top: 3px; --consumer: yes',
          { color: 'red', '--nv-text-color': 'wrong' },
        ],
      },
      global: { provide: { theme: { text: { color: 'right' } } } },
    })
    const style = (wrapper.element as HTMLElement).style
    expect(style.marginTop).toBe('3px')
    expect(style.color).toBe('red')
    expect(style.getPropertyValue('--consumer')).toBe('yes')
    expect(style.getPropertyValue('--nv-text-color')).toBe('right')
    await wrapper.setProps({ style: { paddingTop: '4px' } })
    expect(style.marginTop).toBe('')
    expect(style.paddingTop).toBe('4px')
    expect(style.getPropertyValue('--nv-text-color')).toBe('right')
    wrapper.unmount()
  })
  it('restores consumer custom properties when the theme stops owning them', async () => {
    const theme = ref<Record<string, unknown>>({ text: { color: 'theme' } })
    const Surface = pandaComponent('div')
    const wrapper = mount(Surface, {
      attrs: { style: { '--nv-text-color': 'consumer' } },
      global: { provide: { theme } },
    })
    try {
      const style = (wrapper.element as HTMLElement).style
      expect(style.getPropertyValue('--nv-text-color')).toBe('theme')
      theme.value = {}
      await nextTick()
      expect(style.getPropertyValue('--nv-text-color')).toBe('consumer')
    } finally {
      wrapper.unmount()
    }
  })
  it('restores primitive-root custom properties when theme ownership ends', async () => {
    const theme = ref<Record<string, unknown>>({ text: { color: 'theme' } })
    const primitiveColor = ref('primitive')
    const Primitive = defineComponent({
      inheritAttrs: false,
      setup:
        (_, { attrs }) =>
        () =>
          h(
            'aside',
            mergeProps(
              { style: { '--nv-text-color': primitiveColor.value } },
              attrs,
            ),
          ),
    })
    const wrapper = mount(pandaComponent(Primitive), {
      global: { provide: { theme } },
    })
    try {
      const style = (wrapper.get('aside').element as HTMLElement).style
      expect(style.getPropertyValue('--nv-text-color')).toBe('theme')
      theme.value = {}
      await nextTick()
      expect(style.getPropertyValue('--nv-text-color')).toBe('primitive')
      theme.value = { text: { color: 'next' } }
      await nextTick()
      primitiveColor.value = 'updated primitive'
      await nextTick()
      expect(style.getPropertyValue('--nv-text-color')).toBe('next')
      theme.value = {}
      await nextTick()
      expect(style.getPropertyValue('--nv-text-color')).toBe(
        'updated primitive',
      )
    } finally {
      wrapper.unmount()
    }
  })
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
    const theme = ref({ text: { body: { foreground: '#123456' } } })
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
      (w.element as HTMLElement).style.getPropertyValue(
        '--nv-text-body-foreground',
      ),
    ).toBe('#123456')
    theme.value = { text: { body: { foreground: '#abcdef' } } }
    await nextTick()
    expect(
      (w.element as HTMLElement).style.getPropertyValue(
        '--nv-text-body-foreground',
      ),
    ).toBe('#abcdef')
    w.unmount()
  })
})
