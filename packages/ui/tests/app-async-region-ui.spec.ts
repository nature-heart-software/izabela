// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import { parse, compileScript } from '@vue/compiler-sfc'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
execFileSync(process.execPath, [resolve(here, 'build-client.mjs')], {
  stdio: 'pipe',
})
const clientPath = '../../../coverage/ui-client/test-client.js'
const ui = await import(/* @vite-ignore */ clientPath)
const filename = resolve(
  here,
  '../../../apps/app/src/components/NvAsyncRegion.vue',
)
const code = ts.transpileModule(
  compileScript(
    parse(readFileSync(filename, 'utf8'), { filename }).descriptor,
    { id: filename, inlineTemplate: true },
  ).content,
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  },
).outputText
const module = { exports: {} as { default: Vue.Component } }
const imports: Record<string, unknown> = {
  vue: Vue,
  '@packages/ui': ui,
  '@/styled-system/patterns': { grid: () => '', box: () => '' },
}
new Function('require', 'module', 'exports', code)(
  (id: string) => {
    if (Object.hasOwn(imports, id)) return imports[id]
    throw Error(`Unexpected region import: ${id}`)
  },
  module,
  module.exports,
)
const wrappers: VueWrapper[] = []
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
})
afterEach(async () => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  await flushPromises()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

it('resolves a cold region with real portalled Select controls without deferred-Teleport teardown errors', async () => {
  let release!: (component: Vue.Component) => void
  const Async = Vue.markRaw(
    Vue.defineAsyncComponent(
      () =>
        new Promise<Vue.Component>((resolve) => {
          release = resolve
        }),
    ),
  )
  const errors: unknown[] = []
  const Host = Vue.defineComponent({
    render: () =>
      Vue.h(
        ui.NvTooltip,
        {},
        {
          default: () => 'Voice tooltip',
          reference: () =>
            Vue.h(module.exports.default, {
              component: Async,
              mode: 'control',
              size: 'sm',
              placeholder: 'Provider placeholder',
              'aria-label': 'Voice',
            }),
        },
      ),
  })
  const wrapper = mount(Host, {
    attachTo: document.body,

    global: {
      provide: {
        theme: ui.themes.get('dark'),
        [ui.PORTAL_TARGET]: document.body,
      },
      config: { errorHandler: (error) => errors.push(error) },
    },
  })
  wrappers.push(wrapper)
  await flushPromises()
  await Vue.nextTick()
  expect(wrapper.find('input:disabled').exists()).toBe(true)
  expect(wrapper.get('input:disabled').attributes('placeholder')).toBe('')
  expect(wrapper.find('.nv-loading-mask svg').exists()).toBe(true)
  expect(wrapper.get('.nv-loading-mask').text()).toBe('')
  release(
    Vue.defineComponent({
      render: () =>
        Vue.h(ui.NvSelect, {
          options: [{ label: 'Alpha', value: 'a' }],
          modelValue: 'a',
          size: 'sm',
        }),
    }),
  )
  await flushPromises()
  await Vue.nextTick()
  await new Promise((resolve) => setTimeout(resolve, 40))
  expect(errors.map((error) => String(error))).toEqual([])
  expect(wrapper.find('[role=alert]').exists()).toBe(false)
  expect(wrapper.find('input:not(:disabled)').exists()).toBe(true)
  expect(wrapper.find('input:disabled').exists()).toBe(false)
  expect(wrapper.find('.nv-loading-mask').exists()).toBe(false)
  expect(wrapper.get('[data-async-region]').attributes('aria-busy')).toBe(
    'false',
  )
})

it('uses a text-free spinner for a pending panel and removes it when the form resolves', async () => {
  let release!: (component: Vue.Component) => void
  const Async = Vue.markRaw(
    Vue.defineAsyncComponent(
      () =>
        new Promise<Vue.Component>((resolve) => {
          release = resolve
        }),
    ),
  )
  const wrapper = mount(module.exports.default, {
    attachTo: document.body,
    props: { component: Async, mode: 'panel' },
    global: {
      provide: {
        theme: ui.themes.get('dark'),
        [ui.PORTAL_TARGET]: document.body,
      },
    },
  })
  wrappers.push(wrapper)
  await flushPromises()
  await Vue.nextTick()
  expect(wrapper.text()).toBe('')
  expect(wrapper.find('.nv-loading-mask svg').exists()).toBe(true)
  expect(wrapper.get('[role=status]').attributes('aria-label')).toBe('Loading')
  expect(wrapper.attributes('aria-busy')).toBe('true')
  release(Vue.defineComponent({ render: () => Vue.h('section', 'Ready form') }))
  await flushPromises()
  await Vue.nextTick()
  expect(wrapper.find('.nv-loading-mask').exists()).toBe(false)
  expect(wrapper.attributes('aria-busy')).toBe('false')
  expect(wrapper.text()).toBe('Ready form')
})
