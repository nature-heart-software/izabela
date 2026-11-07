// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, inject, ref, Teleport } from 'vue'
import styled from 'vue3-styled-components'
import { ThemeProvider } from '../src/themes/provider'
import { pandaComponent } from '../src/utils/panda'

describe('application theme provider', () => {
  it('keeps nested selected themes on real body and external Teleports across switches and movement', async () => {
    const Surface = pandaComponent('aside', {}, () => 'portal-surface')
    const outer = ref({ text: { body: { foreground: '#123456' } } })
    const inner = ref<Record<string, unknown>>({
      text: { body: { foreground: '#abcdef' } },
      obsolete: 'old',
    })
    const target = ref<string | HTMLElement>('body')
    const external = document.createElement('div')
    document.body.append(external)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ThemeProvider,
            { theme: outer.value },
            {
              default: () => [
                h('div', { id: 'portal-in-outer' }),
                h(Teleport, { to: 'body' }, [
                  h(Surface, { id: 'outer-surface' }),
                ]),
                h(
                  ThemeProvider,
                  { theme: inner.value },
                  {
                    default: () =>
                      h(Teleport, { to: target.value }, [
                        h(Surface, { id: 'inner-surface' }),
                      ]),
                  },
                ),
              ],
            },
          ),
      }),
      { attachTo: document.body },
    )
    try {
      const outerSurface = document.querySelector(
        '#outer-surface',
      ) as HTMLElement
      const innerSurface = document.querySelector(
        '#inner-surface',
      ) as HTMLElement
      const assertTheme = (surface: HTMLElement, value: string) => {
        expect(surface.hasAttribute('data-nv-theme')).toBe(true)
        expect(
          surface.style.getPropertyValue('--nv-text-body-foreground'),
        ).toBe(value)
      }
      expect(innerSurface.parentElement).toBe(document.body)
      assertTheme(outerSurface, '#123456')
      assertTheme(innerSurface, '#abcdef')

      outer.value = { text: { body: { foreground: '#654321' } } }
      inner.value = { text: { body: { foreground: '#fedcba' } } }
      await wrapper.vm.$nextTick()
      assertTheme(outerSurface, '#654321')
      assertTheme(innerSurface, '#fedcba')
      expect(innerSurface.style.getPropertyValue('--nv-obsolete')).toBe('')

      // Physical target ancestry must not replace the nested logical selection.
      target.value = '#portal-in-outer'
      await wrapper.vm.$nextTick()
      expect(innerSurface.parentElement).toBe(
        wrapper.get('#portal-in-outer').element,
      )
      assertTheme(innerSurface, '#fedcba')
      target.value = external
      await wrapper.vm.$nextTick()
      expect(innerSurface.parentElement).toBe(external)
      inner.value = { text: { body: { foreground: '#112233' } } }
      await wrapper.vm.$nextTick()
      expect(document.querySelector('#inner-surface')).toBe(innerSurface)
      assertTheme(innerSurface, '#112233')
      assertTheme(outerSurface, '#654321')
    } finally {
      wrapper.unmount()
      external.remove()
    }
  })
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
      expect(wrapper.find('[data-nv-theme]').exists()).toBe(true)
      const boundary = wrapper.get('[data-nv-theme]').element as HTMLElement
      const legacyClass = wrapper.get('aside').attributes('class')
      expect(boundary.style.getPropertyValue('--nv-text-color')).toBe('#111111')
      const shared = injected
      selected.value = { text: { color: '#eeeeee' } }
      await wrapper.vm.$nextTick()
      expect(injected).toBe(shared)
      expect(injected.obsolete).toBeUndefined()
      expect(boundary.style.getPropertyValue('--nv-text-color')).toBe('#eeeeee')
      expect(surface.style.getPropertyValue('--nv-text-color')).toBe('#eeeeee')
      expect(wrapper.get('aside').attributes('class')).not.toBe(legacyClass)
      expect(mounts).toBe(1)
    } finally {
      wrapper.unmount()
    }
  })
})
