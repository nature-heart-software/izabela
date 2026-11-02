// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, inject, ref } from 'vue'
import styled from 'vue3-styled-components'
import { ThemeProvider } from '../src/themes/provider'
import { pandaComponent } from '../src/utils/panda'

describe('application theme provider', () => {
  it('updates existing Panda and legacy consumers when the selected theme changes', async () => {
    const Surface = pandaComponent('section', {}, () => 'surface')
    const Legacy = styled('aside')`
      color: ${({ theme }: any) => theme.text.color};
    `
    const selected = ref<Record<string, unknown>>({
      text: { color: '#111111' },
      obsolete: 'old',
    })
    let injected: any
    let mounts = 0
    const Content = defineComponent({
      setup() {
        mounts++
        injected = inject('theme')
        return () =>
          h(Surface, null, {
            default: () => h(Legacy, null, { default: () => 'Content' }),
          })
      },
    })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ThemeProvider,
            { theme: selected.value },
            {
              default: () => h(Content),
            },
          ),
      }),
      { attachTo: document.body },
    )
    try {
      const surface = wrapper.get('section').element as HTMLElement
      const legacyClass = wrapper.get('aside').attributes('class')
      expect(surface.style.getPropertyValue('--nv-text-color')).toBe('#111111')
      const shared = injected
      selected.value = { text: { color: '#eeeeee' } }
      await wrapper.vm.$nextTick()
      expect(injected).toBe(shared)
      expect(injected.obsolete).toBeUndefined()
      expect(surface.style.getPropertyValue('--nv-text-color')).toBe('#eeeeee')
      expect(wrapper.get('aside').attributes('class')).not.toBe(legacyClass)
      expect(mounts).toBe(1)
    } finally {
      wrapper.unmount()
    }
  })
})
