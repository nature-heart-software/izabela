// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { compile, defineComponent, h, nextTick, reactive, ref } from 'vue'
import { parse } from '@vue/compiler-sfc'
import {
  createMemoryHistory,
  createRouter,
  RouterView,
  useRoute,
} from 'vue-router'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('application route scroll state', () => {
  it.each(['NvSettings', 'NvMessages'])(
    '%s retains its scroll container and draft when the surrounding view updates',
    async (name) => {
      // Compile the application's real route template. Isolate its stores and
      // presentation so the test exercises RouterView/VNode identity directly.
      const source = readFileSync(
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          `../../../apps/app/src/teams/messenger/views/${name}.vue`,
        ),
        'utf8',
      )
      const template = parse(source).descriptor.template!.content
      const state = reactive({ markForRestart: false })
      const instances = ref<{ id: string }[]>([])
      let mounts = 0
      const Page = defineComponent({
        setup() {
          mounts++
          const draft = ref('')
          return () =>
            h('input', {
              'data-test': 'route-draft',
              value: draft.value,
              onInput: (event: Event) => {
                draft.value = (event.target as HTMLInputElement).value
              },
            })
        },
      })
      const Shell = defineComponent({
        render: compile(template),
        setup: () => ({
          css: () => '',
          currentRoute: useRoute(),
          navigation: [],
          messengerStateStore: state,
          isGameOverlay: false,
          instances,
        }),
      })
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            component: Shell,
            children: [
              { path: 'general', component: Page },
              { path: 'other', component: Page },
            ],
          },
        ],
      })
      await router.push('/general')
      await router.isReady()
      const passthrough = {
        template: '<div><slot /><slot name="reference" /></div>',
      }
      const wrapper = mount(
        { render: () => h(RouterView) },
        {
          attachTo: document.body,
          global: {
            plugins: [router],
            stubs: Object.fromEntries(
              [
                'NvCard',
                'NvStack',
                'NvText',
                'NvTooltip',
                'NvButton',
                'NvPortalTarget',
                'NvMarkForRestartMessage',
                'NvStoreDialog',
                'NvPanelNavigation',
              ].map((component) => [component, passthrough]),
            ),
          },
        },
      )
      wrappers.push(wrapper)
      const input = wrapper.get('[data-test=route-draft]')
      const scroller = input.element.parentElement!
      scroller.scrollTop = 320
      await input.setValue('Unfinished edit')

      state.markForRestart = true
      instances.value.push({ id: 'confirmation' })
      wrapper.findComponent(Shell).vm.$forceUpdate()
      await nextTick()
      // RouterView supplies a fresh VNode when it renders again, even while
      // the matched route and page component remain the same.
      wrapper.findAllComponents(RouterView).at(-1)!.vm.$forceUpdate()
      await nextTick()
      await flushPromises()

      expect(wrapper.get('[data-test=route-draft]').element.parentElement).toBe(
        scroller,
      )
      expect(scroller.scrollTop).toBe(320)
      expect(
        (wrapper.get('[data-test=route-draft]').element as HTMLInputElement)
          .value,
      ).toBe('Unfinished edit')
      expect(mounts).toBe(1)

      await router.push('/other')
      await flushPromises()
      expect(
        wrapper.get('[data-test=route-draft]').element.parentElement,
      ).not.toBe(scroller)
      expect(
        (wrapper.get('[data-test=route-draft]').element as HTMLInputElement)
          .value,
      ).toBe('')
    },
  )
})
