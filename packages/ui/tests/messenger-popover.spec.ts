// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import * as VueRouter from 'vue-router'
import * as Ark from '@ark-ui/vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { Component, ComputedRef } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const require = createRequire(import.meta.url)
const source = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../apps/app/src/teams/messenger/components/NvMessenger.vue',
  ),
  'utf8',
)
const wrappers: VueWrapper[] = []
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
interface Messenger {
  navigateTo: (location: RouteLocationRaw) => Promise<unknown> | void
  isViewShown: ComputedRef<boolean>
}

// Compile the real messenger script and template, isolating only its desktop,
// store and presentation boundaries. Router, Vue and Ark remain real.
async function fixture() {
  let messenger!: Messenger
  const patches = vi.fn()
  const reposition = vi.fn()
  const requests = vi.fn()
  const Div = Vue.defineComponent({
    inheritAttrs: true,
    setup:
      (_, { slots }) =>
      () =>
        Vue.h('div', slots.default?.()),
  })
  const Navigation = Vue.defineComponent({
    setup() {
      messenger = Vue.inject<Messenger>('messenger')!
      return () =>
        Vue.h(
          'button',
          {
            'data-navigation': '',
            onClick: () => messenger.navigateTo({ name: 'settings' }),
          },
          'Settings',
        )
    },
  })
  const Moveable = Vue.defineComponent({
    emits: ['drag'],
    setup(_, { expose }) {
      expose({ updateTarget: vi.fn(), request: requests })
      return () => Vue.h('div', { 'data-moveable': '' })
    },
  })
  const compiled = compileScript(parse(source).descriptor, {
    id: 'messenger-test',
    inlineTemplate: true,
  })
  const code = ts.transpileModule(compiled.content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} as { default: Component } }
  const imports: Record<string, unknown> = {
    vue: Vue,
    'vue-router': VueRouter,
    '@ark-ui/vue': {
      ...Ark,
      usePopover: (...args: Parameters<typeof Ark.usePopover>) => {
        const controller = Ark.usePopover(...args)
        return Vue.computed(() => ({
          ...controller.value,
          reposition: () => {
            reposition()
            controller.value.reposition()
          },
        }))
      },
    },
    '@/styled-system/css': { css: () => '' },
    '@packages/ui': {
      NvCard: Div,
      NvGroup: Div,
      tokens: { spacing: { 4: 16 } },
    },
    'vue3-moveable': { default: Moveable, __esModule: true },
    '@/teams/messenger/store': {
      useMessengerStore: () => ({ $patch: patches }),
    },
    '@/consts.ts': { isGameOverlay: false },
    '@vueuse/core': {
      useWindowSize: () => ({ width: Vue.ref(1024), height: Vue.ref(768) }),
      useElementSize: () => ({ width: Vue.ref(768), height: Vue.ref(180) }),
      useEventListener: () => {},
    },
  }
  new Function('require', 'module', 'exports', code)(
    (id: string) => {
      if (id in imports) return imports[id]
      if (id.endsWith('NvMessengerNavigationBar.vue'))
        return { default: Navigation, __esModule: true }
      if (id.endsWith('.vue')) return { default: Div, __esModule: true }
      return require(id)
    },
    module,
    module.exports,
  )
  let mounts = 0
  const Page = Vue.defineComponent({
    emits: ['close'],
    setup(_, { emit }) {
      mounts++
      const draft = Vue.ref('')
      return () =>
        Vue.h('section', [
          Vue.h('input', {
            value: draft.value,
            'data-draft': '',
            onInput: (event: Event) => {
              draft.value = (event.target as HTMLInputElement).value
            },
          }),
          Vue.h(
            'button',
            {
              'data-close': '',
              'data-messenger-panel-close': '',
              onClick: () => emit('close'),
            },
            'Close',
          ),
        ])
    },
  })
  const router = VueRouter.createRouter({
    history: VueRouter.createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/settings', name: 'settings', component: Page },
      { path: '/messages', name: 'messages', component: Page },
    ],
  })
  await router.push('/')
  await router.isReady()
  const portal = document.createElement('div')
  portal.id = 'router-overlay'
  document.body.append(portal)
  const wrapper = mount(module.exports.default, {
    attachTo: document.body,
    props: { transform: 'translate(100px, 400px)' },
    global: {
      plugins: [router],
      provide: { 'router-overlay': Vue.ref(portal) },
      stubs: { transition: false },
    },
  })
  wrappers.push(wrapper)
  await flushPromises()
  return {
    wrapper,
    portal,
    router,
    messenger,
    patches,
    reposition,
    requests,
    mounts: () => mounts,
    Moveable,
  }
}

beforeEach(() => {
  // jsdom has no layout observer; Ark's real positioning lifecycle still runs.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(async () => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  await flushPromises()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('messenger routed popover', () => {
  it.each(['button', 'panel-input'])(
    'releases a focused %s when the drag bar prevents the mouse default',
    async (kind) => {
      const f = await fixture()
      if (kind === 'panel-input') {
        await f.messenger.navigateTo({ name: 'settings' })
        await flushPromises()
      }
      const focused =
        kind === 'button'
          ? f.wrapper.get<HTMLButtonElement>('[data-navigation]').element
          : f.portal.querySelector<HTMLInputElement>('[data-draft]')!
      focused.focus()
      const handle = f.wrapper.get<HTMLElement>('.moveable-handle').element
      const surface = document.createElement('span')
      handle.append(surface)
      handle.addEventListener('mousedown', (event) => event.preventDefault())
      const pointer = new MouseEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
      })
      surface.dispatchEvent(pointer)
      const mouse = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
      })
      surface.dispatchEvent(mouse)
      await Vue.nextTick()
      expect(mouse.defaultPrevented).toBe(true)
      expect(pointer.defaultPrevented).toBe(false)
      expect(document.activeElement).not.toBe(focused)
      expect(f.messenger.isViewShown.value).toBe(kind === 'panel-input')
    },
  )

  it('preserves focus when pressing an interactive control within the drag bar', async () => {
    const f = await fixture()
    const handle = f.wrapper.get<HTMLElement>('.moveable-handle').element
    const control = document.createElement('button')
    const icon = document.createElement('span')
    control.append(icon)
    handle.append(control)
    control.focus()
    icon.dispatchEvent(
      new MouseEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    )
    expect(document.activeElement).toBe(control)
  })

  it.each([1, 2])(
    'does not clear focus on drag-bar mouse button %s',
    async (button) => {
      const f = await fixture()
      const focused =
        f.wrapper.get<HTMLButtonElement>('[data-navigation]').element
      focused.focus()
      f.wrapper.get('.moveable-handle').element.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button,
        }),
      )
      expect(document.activeElement).toBe(focused)
    },
  )

  it('does not let the closing reset cancel a later guarded navigation', async () => {
    const f = await fixture()
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    await f.messenger.navigateTo({ name: 'settings' })
    await Vue.nextTick()
    let release!: () => void
    let entered!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const ready = new Promise<void>((resolve) => {
      entered = resolve
    })
    f.router.beforeEach(async (to) => {
      if (to.name === 'messages') {
        entered()
        await held
      }
    })
    const navigation = f.messenger.navigateTo({ name: 'messages' })
    await ready
    await delay(320)
    release()
    await navigation
    await flushPromises()
    expect(
      f.router.currentRoute.value.name,
      'close completion must not supersede the requested route',
    ).toBe('messages')
    expect(f.messenger.isViewShown.value).toBe(true)
  })

  it('uses the real hook reposition API after anchor dragging', async () => {
    const f = await fixture()
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    const target = f.wrapper.get<HTMLElement>('#moveable').element
    f.wrapper.findComponent(f.Moveable).vm.$emit('drag', {
      target,
      transform: 'translate(180px, 440px)',
    })
    expect(target.style.transform).toBe('translate(180px, 440px)')
    expect(f.reposition).toHaveBeenCalledTimes(1)
  })

  it('focuses Close on opening while keeping manual dismissal and navigation buttons', async () => {
    const f = await fixture()
    const navigation =
      f.wrapper.get<HTMLButtonElement>('[data-navigation]').element
    navigation.focus()
    navigation.click()
    await flushPromises()
    await delay(40)
    expect(document.activeElement).toBe(f.portal.querySelector('[data-close]'))
    const input = f.portal.querySelector<HTMLInputElement>('[data-draft]')!
    input.focus()
    await delay(40)
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
    document.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true }),
    )
    document.body.click()
    await delay(40)
    expect(f.messenger.isViewShown.value).toBe(true)
    expect(document.activeElement).toBe(input)
    navigation.click()
    await flushPromises()
    expect(f.messenger.isViewShown.value).toBe(false)
  })

  it('focuses Close when reopening a retained panel during its exit transition', async () => {
    const f = await fixture()
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    await delay(40)
    const input = f.portal.querySelector<HTMLInputElement>('[data-draft]')!
    input.value = 'Retained draft'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.focus()
    f.portal.querySelector<HTMLButtonElement>('[data-close]')!.click()
    await Vue.nextTick()
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    await delay(40)
    expect(document.activeElement).toBe(f.portal.querySelector('[data-close]'))
    expect(f.mounts()).toBe(1)
    expect(
      f.portal.querySelector<HTMLInputElement>('[data-draft]')!.value,
    ).toBe('Retained draft')
  })

  it('cancels delayed drag and focus work when the messenger unmounts', async () => {
    vi.useFakeTimers()
    const f = await fixture()
    f.wrapper.findComponent(f.Moveable).vm.$emit('drag', {
      target: f.wrapper.get('#moveable').element,
      transform: 'translate(180px, 440px)',
    })
    f.wrapper.unmount()
    wrappers.splice(wrappers.indexOf(f.wrapper), 1)
    await vi.runAllTimersAsync()
    expect(
      f.requests,
      'unmount must cancel delayed focus/drag requests',
    ).not.toHaveBeenCalled()
    expect(
      f.patches,
      'unmount must cancel debounced position writes',
    ).not.toHaveBeenCalled()
  })

  it('does not reopen after a panel close while a router guard is pending', async () => {
    const f = await fixture()
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    let release!: () => void
    let entered!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const ready = new Promise<void>((resolve) => {
      entered = resolve
    })
    f.router.beforeEach(async (to) => {
      if (to.name === 'messages') {
        entered()
        await held
      }
    })
    const navigation = f.messenger.navigateTo({ name: 'messages' })
    await ready
    f.portal.querySelector<HTMLButtonElement>('[data-close]')!.click()
    await Vue.nextTick()
    release()
    await navigation
    await flushPromises()
    expect(
      f.messenger.isViewShown.value,
      'a completed stale navigation must not undo close',
    ).toBe(false)
  })

  it('retains drafts through updates and a cancelled close, then resets after full close', async () => {
    const f = await fixture()
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    const input = f.portal.querySelector<HTMLInputElement>('[data-draft]')!
    input.value = 'Unfinished edit'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    f.wrapper.vm.$forceUpdate()
    await Vue.nextTick()
    expect(f.portal.querySelector('[data-draft]')).toBe(input)
    expect(input.value).toBe('Unfinished edit')
    await f.messenger.navigateTo({ name: 'settings' })
    await Vue.nextTick()
    expect(f.messenger.isViewShown.value).toBe(false)
    expect(f.router.currentRoute.value.name).toBe('settings')
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    await delay(320)
    expect(f.router.currentRoute.value.name).toBe('settings')
    expect(f.portal.querySelector('[data-draft]')).toBe(input)
    expect(input.value).toBe('Unfinished edit')
    f.portal.querySelector<HTMLButtonElement>('[data-close]')!.click()
    await Vue.nextTick()
    expect(f.router.currentRoute.value.name).toBe('settings')
    await delay(320)
    await flushPromises()
    expect(f.router.currentRoute.value.path).toBe('/')
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    expect(f.messenger.isViewShown.value).toBe(true)
    expect(
      f.portal.querySelector<HTMLInputElement>('[data-draft]')!.value,
    ).toBe('')
    expect(f.mounts()).toBe(2)
  })

  it('resets a fully closed route when a pending navigation guard throws', async () => {
    const f = await fixture()
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    const input = f.portal.querySelector<HTMLInputElement>('[data-draft]')!
    input.value = 'Unfinished edit'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    const content = f.portal.querySelector<HTMLElement>(
      '[data-scope="popover"][data-part="content"]',
    )!
    f.portal.querySelector<HTMLButtonElement>('[data-close]')!.click()
    await Vue.nextTick()
    const problem = new Error('Navigation unavailable after leave')
    const onError = vi.fn()
    f.router.onError(onError)
    let release!: () => void
    let entered!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const ready = new Promise<void>((resolve) => {
      entered = resolve
    })
    f.router.beforeEach(async (to) => {
      if (to.name === 'messages') {
        entered()
        await held
        throw problem
      }
    })
    const rejection = expect(
      f.messenger.navigateTo({ name: 'messages' }),
    ).rejects.toBe(problem)
    try {
      await ready
      await delay(320)
      await flushPromises()
      expect(
        content.style.display,
        'leave must complete before rejection',
      ).toBe('none')
      expect(content.classList.contains('messenger-panel-leave-active')).toBe(
        false,
      )
      expect(f.router.currentRoute.value.path).toBe('/settings')
      expect(input.value).toBe('Unfinished edit')
    } finally {
      release()
      await rejection
    }
    await flushPromises()
    expect(onError).toHaveBeenCalledWith(
      problem,
      expect.anything(),
      expect.anything(),
    )
    expect(
      f.router.currentRoute.value.path,
      'a thrown navigation after leave must reset the closed route',
    ).toBe('/')
    expect(f.messenger.isViewShown.value).toBe(false)
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    expect(f.messenger.isViewShown.value).toBe(true)
    const freshInput = f.portal.querySelector<HTMLInputElement>('[data-draft]')!
    expect(freshInput).not.toBe(input)
    expect(freshInput.value).toBe('')
    expect(f.mounts()).toBe(2)
  })

  it('does not open stale content after a router guard throws', async () => {
    const f = await fixture()
    const problem = new Error('Navigation unavailable')
    const onError = vi.fn()
    f.router.onError(onError)
    f.router.beforeEach(() => {
      throw problem
    })
    await expect(f.messenger.navigateTo({ name: 'settings' })).rejects.toBe(
      problem,
    )
    await flushPromises()
    expect(onError).toHaveBeenCalledWith(
      problem,
      expect.anything(),
      expect.anything(),
    )
    expect(f.router.currentRoute.value.path).toBe('/')
    expect(f.messenger.isViewShown.value).toBe(false)
  })

  it('does not show the old route when navigation is rejected', async () => {
    const f = await fixture()
    f.router.beforeEach((to) => (to.name === 'settings' ? false : undefined))
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    expect(f.router.currentRoute.value.path).toBe('/')
    expect(
      f.messenger.isViewShown.value,
      'rejected navigation must not open a stale panel',
    ).toBe(false)
  })

  it('opens the real routed panel in the theme portal without making the messenger a button', async () => {
    const f = await fixture()
    await f.messenger.navigateTo({ name: 'settings' })
    await flushPromises()
    await delay(40)
    expect(f.router.currentRoute.value.name).toBe('settings')
    const positioner = f.portal.querySelector(
      '[data-scope="popover"][data-part="positioner"]',
    )
    expect(
      positioner,
      'routed content must use the Ark positioner in router-overlay',
    ).not.toBeNull()
    expect(positioner!.querySelector('[data-draft]')).not.toBeNull()
    expect(f.messenger.isViewShown.value).toBe(true)
    const card = f.wrapper.get('.messenger').element
    expect(card.tagName).not.toBe('BUTTON')
    expect(card.closest('button, [role="button"]')).toBeNull()
    expect(
      f.wrapper
        .get('[data-scope="popover"][data-part="anchor"]')
        .attributes('id'),
    ).toBe('messenger-panel-anchor')
  })
})
