// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../apps/app/src',
)
const wrappers: VueWrapper[] = []
const gridPattern = vi.fn(() => 'region-grid')
const boxPattern = vi.fn(
  (style: { display: string }) => `region-${style.display}`,
)
const esm = (component: Vue.Component) => ({
  default: component,
  __esModule: true,
})
// Presentation-only boundary: the region must request the real control's disabled
// and sizing props. Vue's async loader and client renderer are not stubbed.
const Select = Vue.defineComponent({
  props: ['disabled', 'size', 'options', 'placeholder', 'modelValue'],
  setup: (props) => () =>
    Vue.h('input', {
      disabled: props.disabled,
      placeholder: props.placeholder,
      'data-select-size': props.size,
    }),
})
const Button = Vue.defineComponent({
  props: ['size'],
  setup:
    (_, { slots }) =>
    () =>
      Vue.h('button', { type: 'button' }, slots.default?.()),
})
const Div = Vue.defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      Vue.h('div', slots.default?.()),
})
const Reference = Vue.defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      Vue.h('div', slots.reference?.()),
})
// The real directive's spinner, styling and cleanup are covered by the real-UI
// suite; this presentation boundary records the requested busy indicator.
const loadingDirective: Vue.Directive<HTMLElement, boolean> = {
  mounted(element, binding) {
    if (!binding.value) return
    element.setAttribute('data-loader-requested', 'true')
    if (element.tagName === 'INPUT') return
    const status = document.createElement('span')
    status.setAttribute('role', 'status')
    status.append(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
    element.append(status)
  },
}
const ui = {
  loadingDirective,
  NvSelect: Select,
  NvButton: Button,
  NvCard: Div,
  NvDivider: Div,
  NvFormItem: Div,
  NvGroup: Div,
  NvPopover: Reference,
  NvStack: Div,
  NvSwitch: Div,
  NvText: Div,
  NvTooltip: Reference,
}
function compile(
  relative: string,
  extra: Record<string, unknown> = {},
): Vue.Component {
  const filename = resolve(app, relative)
  const source = readFileSync(filename, 'utf8')
  const compiled = compileScript(parse(source, { filename }).descriptor, {
    id: relative,
    inlineTemplate: true,
  }).content
  const code = ts.transpileModule(compiled, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} as { default: Vue.Component } }
  const imports: Record<string, unknown> = {
    vue: Vue,
    '@packages/ui': ui,
    '@/styled-system/patterns': { grid: gridPattern, box: boxPattern },
    '@/styled-system/css': {
      css: (style: Record<string, unknown>) =>
        style.width === '13' ? 'voice-width-13' : '',
    },
    ...extra,
  }
  new Function('require', 'module', 'exports', code)(
    (id: string) => {
      if (Object.hasOwn(imports, id)) return imports[id]
      if (id === '@/components/NvAsyncRegion.vue')
        return esm(compile('components/NvAsyncRegion.vue'))
      throw new Error(`Unexpected async-region dependency: ${id}`)
    },
    module,
    module.exports,
  )
  return module.exports.default
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function own(
  component: Vue.Component,
  options: Parameters<typeof mount>[1] = {},
) {
  const wrapper = mount(component, { attachTo: document.body, ...options })
  wrappers.push(wrapper)
  return wrapper
}
const settle = async () => {
  await flushPromises()
  await Vue.nextTick()
}
function provider(name: string, unmounted = vi.fn()) {
  return Vue.defineComponent({
    props: ['size'],
    setup() {
      Vue.onUnmounted(unmounted)
      return () => Vue.h('input', { 'data-provider': name, 'aria-label': name })
    },
  })
}
function audioFixture(component: Vue.Component) {
  const speech = Vue.reactive<{
    currentSpeechEngine?: { voiceSelectComponent?: Vue.Component }
    selectedSpeechEngine: string
  }>({
    currentSpeechEngine: { voiceSelectComponent: Vue.markRaw(component) },
    selectedSpeechEngine: 'A',
  })
  const Audio = compile('teams/messenger/components/NvMessengerAudioBar.vue', {
    '@/features/speech/store': { useSpeechStore: () => speech },
    '@/features/settings/store': {
      useSettingsStore: () => ({ audioOutputs: [], $patch: vi.fn() }),
    },
    '@/features/speech/components/inputs/NvSpeechEngineSelect.vue': esm(Select),
    '@/features/audio/components/inputs/NvAudioOutputsSelect.vue': esm(Div),
    '@/features/speech/components/forms/NvAudioInputForm.vue': esm(Div),
    '@/features/audio/hooks': {
      useAudioDevices: () => ({ audioOutputs: Vue.ref([]) }),
    },
    'vue-router': { useRoute: () => ({ name: 'messenger' }) },
  })
  return {
    speech,
    wrapper: own(Audio, {
      global: {
        provide: {
          messenger: { isViewShown: Vue.ref(false), navigateTo: vi.fn() },
        },
      },
    }),
  }
}
afterEach(async () => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  await settle()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('AudioBar stable voice control', () => {
  it('does not render a voice region when the current engine or its voice component is absent', async () => {
    const f = audioFixture(provider('A'))
    expect(f.wrapper.find('[data-async-region="control"]').exists()).toBe(true)
    f.speech.currentSpeechEngine = {}
    await settle()
    expect(f.wrapper.find('[data-async-region]').exists()).toBe(false)
    f.speech.currentSpeechEngine = undefined
    await settle()
    expect(f.wrapper.find('[data-async-region]').exists()).toBe(false)
  })
  it('keeps the disabled fallback free of stale models and model listeners while retaining safe select options', async () => {
    const held = deferred<Vue.Component>()
    const update = vi.fn()
    const options = [{ label: 'Old voice', value: 'old' }]
    const wrapper = region(
      Vue.defineAsyncComponent(() => held.promise),
      { mode: 'control' },
      {
        size: 'sm',
        options,
        modelValue: 'old',
        'onUpdate:modelValue': update,
        'aria-label': 'Speech voice',
        id: 'voice',
        class: 'voice-width-13',
      },
    )
    const fallback = wrapper.findComponent(Select)
    expect(fallback.props('disabled')).toBe(true)
    expect(fallback.props('size')).toBe('sm')
    expect(fallback.props('options')).toEqual(options)
    expect(
      fallback.props('modelValue'),
      'loading must not display the outgoing selection',
    ).toBeUndefined()
    expect(fallback.vm.$attrs['onUpdate:modelValue']).toBeUndefined()
    expect(wrapper.get('input').attributes('aria-label')).toBe('Speech voice')
    expect((wrapper.element as HTMLElement).style.minHeight).toBe('')
    held.resolve(provider('Voice'))
    await settle()
    expect(wrapper.get('[data-provider="Voice"]').attributes('id')).toBe(
      'voice',
    )
    expect(update).not.toHaveBeenCalled()
  })

  it('replaces an outgoing voice with an immediate sized disabled fallback during a cold provider load', async () => {
    const gone = vi.fn()
    const f = audioFixture(provider('A', gone))
    expect(f.wrapper.find('[data-provider="A"]').exists()).toBe(true)
    const held = deferred<Vue.Component>()
    f.speech.currentSpeechEngine = {
      voiceSelectComponent: Vue.markRaw(
        Vue.defineAsyncComponent(() => held.promise),
      ),
    }
    await settle()
    expect(gone).toHaveBeenCalledOnce()
    expect(f.wrapper.find('[data-provider="A"]').exists()).toBe(false)
    const fallback = f.wrapper.find('input[disabled]')
    expect(
      fallback.exists(),
      'cold voice must not collapse to an empty async comment',
    ).toBe(true)
    expect(fallback.attributes('data-select-size')).toBe('sm')
    expect(fallback.attributes('placeholder')).toBe('')
    expect(fallback.attributes('data-loader-requested')).toBe('true')
    expect(fallback.element.closest('.voice-width-13')).not.toBeNull()
    held.resolve(provider('B'))
    await settle()
    expect(f.wrapper.get('[data-provider="B"]').attributes('data-v-step')).toBe(
      'engine-voice-select',
    )
    expect(f.wrapper.get('[data-provider="B"]').attributes('placement')).toBe(
      'top-start',
    )
  })
})

function geometry(initial: Record<string, number> = {}) {
  const heights = { ...initial }
  const observers: Array<{
    deliver: () => void
    late: () => void
    disconnect: ReturnType<typeof vi.fn>
  }> = []
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      const name =
        this.querySelector('[data-provider]')?.getAttribute('data-provider')
      return new DOMRect(0, 0, 320, name ? heights[name] ?? 0 : 17)
    },
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      target?: Element
      disconnect = vi.fn(() => {
        this.target = undefined
      })
      constructor(private callback: ResizeObserverCallback) {
        observers.push(this)
      }
      observe(target: Element) {
        this.target = target
      }
      unobserve() {
        this.target = undefined
      }
      late = () => this.callback([], this as unknown as ResizeObserver)
      deliver = () => {
        if (this.target)
          this.callback(
            [
              {
                target: this.target,
                contentRect: this.target.getBoundingClientRect(),
              } as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
          )
      }
    },
  )
  return {
    heights,
    observers,
    resize: () => observers.forEach((observer) => observer.deliver()),
  }
}
function region(
  component: Vue.Component,
  props: Record<string, unknown> = {},
  attrs: Record<string, unknown> | Vue.Ref<Record<string, unknown>> = {},
) {
  const Region = compile('components/NvAsyncRegion.vue')
  if (Vue.isRef(attrs))
    return own(
      Vue.defineComponent({
        setup: () => () =>
          Vue.h(Region, {
            component: Vue.markRaw(component),
            ...props,
            ...attrs.value,
          }),
      }),
    )
  return own(Region, {
    props: { component: Vue.markRaw(component), ...props },
    attrs,
  })
}

describe('stable async panel', () => {
  it('forwards native attrs, model and listeners once to the child but keeps class and style on the stable root', async () => {
    const mounted = vi.fn()
    const Child = Vue.defineComponent({
      props: ['modelValue'],
      emits: ['update:modelValue'],
      setup(props, { emit }) {
        mounted()
        return () =>
          Vue.h('input', {
            value: props.modelValue,
            onInput: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLInputElement).value,
              ),
          })
      },
    })
    const click = vi.fn()
    const focus = vi.fn()
    const update = vi.fn()
    const wrapper = region(
      Child,
      { componentKey: 'one' },
      {
        class: 'outer-only',
        style: { width: '320px', minHeight: '12px' },
        id: 'native-id',
        'aria-label': 'Provider setting',
        'aria-describedby': 'help',
        'data-v-step': 'native-step',
        modelValue: 'initial',
        'onUpdate:modelValue': update,
        onClick: click,
        onFocus: focus,
      },
    )
    await settle()
    const root = wrapper.element as HTMLElement
    expect(root.dataset.asyncRegion).toBe('panel')
    expect(root.classList.contains('outer-only')).toBe(true)
    expect(root.style.width).toBe('320px')
    expect(root.style.minHeight).toBe('12px')
    expect(root.hasAttribute('id')).toBe(false)
    const input = wrapper.get<HTMLInputElement>('input')
    expect(input.attributes('id')).toBe('native-id')
    expect(input.attributes('aria-label')).toBe('Provider setting')
    expect(input.attributes('aria-describedby')).toBe('help')
    expect(input.attributes('data-v-step')).toBe('native-step')
    expect(input.classes()).not.toContain('outer-only')
    expect(input.element.style.width).toBe('')
    expect(input.element.value).toBe('initial')
    await input.trigger('click')
    await input.trigger('focus')
    await input.setValue('changed')
    expect(click).toHaveBeenCalledOnce()
    expect(focus).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledExactlyOnceWith('changed')
    await wrapper.setProps({ componentKey: 'two' })
    await settle()
    expect(mounted).toHaveBeenCalledTimes(2)
    expect(wrapper.element).toBe(root)
  })

  it('updates live child attrs without remounting the resolved provider', async () => {
    const mounted = vi.fn()
    const child = Vue.defineComponent({
      props: ['modelValue'],
      setup(props) {
        Vue.onMounted(mounted)
        return () => Vue.h('input', { value: props.modelValue })
      },
    })
    const wrapper = region(child, { modelValue: 'initial' })
    await settle()
    expect(wrapper.get('input').element.value).toBe('initial')
    await wrapper.setProps({ modelValue: 'updated' })
    await settle()
    expect(wrapper.get('input').element.value).toBe('updated')
    expect(mounted).toHaveBeenCalledOnce()
    expect(wrapper.attributes('aria-busy')).toBe('false')
  })

  it.each(['empty', 'populated'] as const)(
    'forwards attrs across empty boundaries without remounting an initially %s provider',
    async (initial) => {
      const mounted = vi.fn()
      const unmounted = vi.fn()
      const child = Vue.defineComponent({
        props: ['modelValue'],
        emits: ['update:modelValue'],
        setup(props, { emit }) {
          Vue.onMounted(mounted)
          Vue.onUnmounted(unmounted)
          return () =>
            Vue.h('input', {
              value: props.modelValue,
              onInput: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLInputElement).value,
                ),
            })
        },
      })
      const firstClick = vi.fn()
      const firstUpdate = vi.fn()
      const firstAttrs = {
        id: 'first-provider',
        modelValue: 'first',
        onClick: firstClick,
        'onUpdate:modelValue': firstUpdate,
        class: 'outer-only',
        style: { width: '320px' },
      }
      const attrs = Vue.shallowRef<Record<string, unknown>>(
        initial === 'empty' ? {} : firstAttrs,
      )
      const wrapper = region(child, { componentKey: 'stable' }, attrs)
      await settle()
      const instance = wrapper.findComponent(child).vm
      const root = wrapper.element as HTMLElement
      const input = wrapper.get<HTMLInputElement>('input')
      const assertStable = () => {
        expect(wrapper.findComponent(child).vm).toBe(instance)
        expect(wrapper.element).toBe(root)
        expect(wrapper.get('input').element).toBe(input.element)
        expect(mounted).toHaveBeenCalledOnce()
        expect(unmounted).not.toHaveBeenCalled()
        expect(root.getAttribute('aria-busy')).toBe('false')
      }
      const clearAttrs = async () => {
        attrs.value = {}
        await settle()
        assertStable()
        expect(input.attributes('id')).toBeUndefined()
        expect(input.element.value).toBe('')
        expect(root.classList.contains('outer-only')).toBe(false)
        expect(root.style.width).toBe('')
        await input.trigger('click')
        await input.setValue('without-listener')
      }
      if (initial === 'populated') {
        expect(input.attributes('id')).toBe('first-provider')
        expect(input.element.value).toBe('first')
        await clearAttrs()
      } else {
        expect(input.attributes('id')).toBeUndefined()
        expect(input.element.value).toBe('')
      }
      for (const value of ['added', 'repopulated']) {
        const click = vi.fn()
        const update = vi.fn()
        attrs.value = {
          ...firstAttrs,
          id: value,
          modelValue: value,
          onClick: click,
          'onUpdate:modelValue': update,
        }
        await settle()
        assertStable()
        expect(
          input.attributes('id'),
          'new attrs must reach the same provider after an empty attrs render',
        ).toBe(value)
        expect(input.element.value).toBe(value)
        expect(root.hasAttribute('id')).toBe(false)
        expect(root.classList.contains('outer-only')).toBe(true)
        expect(root.style.width).toBe('320px')
        expect(input.classes()).not.toContain('outer-only')
        expect(input.element.style.width).toBe('')
        await input.trigger('click')
        await input.setValue(`${value}-changed`)
        expect(click).toHaveBeenCalledOnce()
        expect(update).toHaveBeenCalledExactlyOnceWith(`${value}-changed`)
        await clearAttrs()
        expect(click).toHaveBeenCalledOnce()
        expect(update).toHaveBeenCalledOnce()
      }
      expect(firstClick).not.toHaveBeenCalled()
      expect(firstUpdate).not.toHaveBeenCalled()
    },
  )

  it('keeps fragment rows in the inherited-gap grid through a layout-transparent host', async () => {
    const fragment = Vue.defineComponent({
      setup: () => () =>
        [Vue.h('section', 'First'), Vue.h('section', 'Second')],
    })
    const wrapper = region(fragment)
    await settle()
    expect(gridPattern).toHaveBeenCalledWith({ gap: 'inherit', minWidth: 0 })
    expect(boxPattern).toHaveBeenCalledWith({ display: 'contents' })
    const host = wrapper.get('.region-contents')
    expect(host.element.children).toHaveLength(2)
    expect([...host.element.children].map((child) => child.tagName)).toEqual([
      'SECTION',
      'SECTION',
    ])
    expect(wrapper.text()).toBe('FirstSecond')
  })

  it('offers a compact accessible control retry without disturbing an independent region', async () => {
    const held = deferred<Vue.Component>()
    const next = deferred<Vue.Component>()
    let attempt = 0
    const lazy = Vue.defineAsyncComponent(() =>
      ++attempt === 1 ? held.promise : next.promise,
    )
    const wrapper = region(
      lazy,
      { mode: 'control' },
      { size: 'sm', class: 'voice-width-13' },
    )
    const other = region(provider('Independent'))
    const root = wrapper.element as HTMLElement
    held.reject(new Error('Cold voice failed'))
    await settle()
    expect(wrapper.get('[role="alert"]').text()).toBe('Retry')
    expect(wrapper.get('button').attributes('aria-label')).toBe('Retry loading')
    expect(wrapper.findComponent(Button).props('size')).toBe('sm')
    expect(root.style.minHeight).toBe('')
    expect(other.find('[data-provider="Independent"]').exists()).toBe(true)
    wrapper.get<HTMLButtonElement>('button').element.click()
    await settle()
    expect(wrapper.findComponent(Select).props('disabled')).toBe(true)
    next.resolve(provider('Recovered voice'))
    await settle()
    expect(wrapper.element).toBe(root)
    expect(wrapper.find('[data-provider="Recovered voice"]').exists()).toBe(
      true,
    )
    expect(other.find('[data-provider="Independent"]').exists()).toBe(true)
  })
  it('shows a busy cold panel without inventing a fixed height', async () => {
    geometry()
    const held = deferred<Vue.Component>()
    const wrapper = region(Vue.defineAsyncComponent(() => held.promise))
    expect(wrapper.get('[role="status"]').text()).toBe('')
    expect(wrapper.find('[role="status"] svg').exists()).toBe(true)
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect((wrapper.element as HTMLElement).style.minHeight).toBe('')
    held.resolve(provider('Ready'))
    await settle()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.attributes('aria-busy')).toBe('false')
  })

  it.each(['resolve', 'reject'] as const)(
    'keeps C current when superseded B settles last (%s)',
    async (outcome) => {
      geometry({ A: 190, C: 65 })
      const aGone = vi.fn()
      const bMounted = vi.fn()
      const wrapper = region(provider('A', aGone))
      const root = wrapper.element
      await settle()
      const b = deferred<Vue.Component>()
      const c = deferred<Vue.Component>()
      await wrapper.setProps({
        component: Vue.markRaw(Vue.defineAsyncComponent(() => b.promise)),
      })
      await wrapper.setProps({
        component: Vue.markRaw(Vue.defineAsyncComponent(() => c.promise)),
      })
      expect((root as HTMLElement).style.minHeight).toBe('190px')
      c.resolve(provider('C'))
      await settle()
      if (outcome === 'resolve')
        b.resolve(
          Vue.defineComponent({
            setup() {
              bMounted()
              return () => Vue.h('div', 'stale B')
            },
          }),
        )
      else b.reject(new Error('Obsolete B failure'))
      await settle()
      expect(wrapper.element).toBe(root)
      expect(wrapper.find('[data-provider="C"]').exists()).toBe(true)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.attributes('aria-busy')).toBe('false')
      expect((root as HTMLElement).style.minHeight).toBe('')
      expect(bMounted).not.toHaveBeenCalled()
      expect(aGone).toHaveBeenCalledOnce()
    },
  )

  it('cleans up observation and ignores a pending completion after unmount', async () => {
    const g = geometry({ A: 160 })
    const wrapper = region(provider('A'))
    await settle()
    const held = deferred<Vue.Component>()
    const lateMount = vi.fn()
    await wrapper.setProps({
      component: Vue.markRaw(Vue.defineAsyncComponent(() => held.promise)),
    })
    const root = wrapper.element as HTMLElement
    const rect = vi.spyOn(root, 'getBoundingClientRect')
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(g.observers).toHaveLength(1)
    expect(g.observers[0].disconnect).toHaveBeenCalledOnce()
    rect.mockClear()
    g.resize()
    g.observers[0].late()
    held.resolve(
      Vue.defineComponent({
        setup() {
          lateMount()
          return () => Vue.h('div', 'late')
        },
      }),
    )
    await settle()
    expect(lateMount).not.toHaveBeenCalled()
    expect(rect).not.toHaveBeenCalled()
    expect(root.isConnected).toBe(false)
  })

  it('manually snapshots the outgoing box when ResizeObserver is unavailable', async () => {
    const g = geometry({ A: 100 })
    vi.stubGlobal('ResizeObserver', undefined)
    const wrapper = region(provider('A'))
    await settle()
    g.heights.A = 277
    const held = deferred<Vue.Component>()
    await wrapper.setProps({
      component: Vue.markRaw(Vue.defineAsyncComponent(() => held.promise)),
    })
    expect((wrapper.element as HTMLElement).style.minHeight).toBe('277px')
    held.resolve(provider('B'))
    await settle()
  })
  it('contains rejection locally and retries the same lazy registration inside the retained region', async () => {
    geometry({ A: 225 })
    const requests = [deferred<Vue.Component>(), deferred<Vue.Component>()]
    const loader = vi.fn(() => requests[loader.mock.calls.length - 1].promise)
    const lazy = Vue.markRaw(Vue.defineAsyncComponent(loader))
    const escaped = vi.fn()
    const wrapper = own(compile('components/NvAsyncRegion.vue'), {
      props: { component: Vue.markRaw(provider('A')) },
      global: { config: { errorHandler: escaped } },
    })
    await settle()
    const root = wrapper.element as HTMLElement
    await wrapper.setProps({ component: lazy })
    requests[0].reject(new Error('Provider chunk unavailable'))
    await settle()
    expect(
      wrapper.find('[role="alert"]').exists(),
      'load rejection must have a local error region',
    ).toBe(true)
    expect(escaped).not.toHaveBeenCalled()
    expect(root.style.minHeight).toBe('225px')
    expect(wrapper.text()).toContain('Unable to load')
    await wrapper.get('button').trigger('click')
    await settle()
    expect(loader).toHaveBeenCalledTimes(2)
    expect(root.style.minHeight).toBe('225px')
    requests[1].resolve(provider('Recovered'))
    await settle()
    expect(wrapper.find('[data-provider="Recovered"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(root.style.minHeight).toBe('')
  })
  it('retains measured outgoing height, ignores fallback resize and releases the reservation on resolve', async () => {
    const g = geometry({ A: 240, B: 80 })
    const wrapper = region(provider('A'))
    await settle()
    const root = wrapper.element as HTMLElement
    expect(root.style.minHeight).toBe('')
    g.heights.A = 316
    g.resize()
    const held = deferred<Vue.Component>()
    await wrapper.setProps({
      component: Vue.markRaw(Vue.defineAsyncComponent(() => held.promise)),
    })
    expect(root.style.minHeight).toBe('316px')
    expect(wrapper.get('[role="status"]').text()).toBe('')
    expect(wrapper.find('[role="status"] svg').exists()).toBe(true)
    expect(root.getAttribute('aria-busy')).toBe('true')
    expect(wrapper.find('[data-provider="A"]').exists()).toBe(false)
    g.resize()
    await settle()
    expect(root.style.minHeight).toBe('316px')
    held.resolve(provider('B'))
    await settle()
    expect(root.style.minHeight).toBe('')
    expect(root.getAttribute('aria-busy')).toBe('false')
    const next = deferred<Vue.Component>()
    await wrapper.setProps({
      component: Vue.markRaw(Vue.defineAsyncComponent(() => next.promise)),
    })
    expect(root.style.minHeight).toBe('80px')
    next.resolve(provider('C'))
    await settle()
  })
})
