// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import * as vue from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import gsap from 'gsap'
import { useEventListener } from '@vueuse/core'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { EventEmitter } from 'node:events'

const require = createRequire(import.meta.url)
const loadTypescript = require('../../../tests/load-typescript.cjs')
const filename = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../apps/app/src/teams/messenger/components/NvBackground.vue',
)
const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
const script = compileScript(descriptor, { id: filename, inlineTemplate: true })
const inputFilename = resolve(dirname(filename), 'NvMessengerInputBar.vue')
const inputDescriptor = parse(readFileSync(inputFilename, 'utf8'), {
  filename: inputFilename,
}).descriptor
const inputScript = compileScript(inputDescriptor, {
  id: inputFilename,
  inlineTemplate: true,
})
const wrappers: VueWrapper[] = []
let listeners: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.useFakeTimers()
  gsap.ticker.remove(gsap.updateRoot)
  gsap.ticker.sleep()
  listeners = vi.spyOn(window, 'addEventListener')
  const style = document.createElement('style')
  style.textContent = '.fixture-backdrop { opacity: 0 }'
  document.head.append(style)
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  // Keep fixtures isolated even if a regression breaks component cleanup.
  for (const [event, listener] of listeners.mock.calls)
    if (event === 'blur') window.removeEventListener(event, listener)
  gsap.globalTimeline.clear()
  gsap.ticker.sleep()
  gsap.ticker.add(gsap.updateRoot)
  document.body.innerHTML = ''
  document.head.querySelectorAll('style').forEach((style) => style.remove())
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function fixture(withInput = false) {
  const state = vue.reactive({
    isInputFocused: false,
    isFocused: false,
    isShown: true,
    focusContext: 'keyboard',
    $patch(value: Record<string, unknown>) {
      Object.assign(this, value)
    },
  })
  const component = loadTypescript(
    filename,
    {
      vue,
      gsap,
      '@/styled-system/css': {
        css: (style: { opacity?: number }) =>
          style.opacity === 0 ? 'fixture-backdrop' : '',
      },
      '@/modules/vue-hitboxes/NvHitbox.vue': {
        render: () => vue.h('div', { 'data-test': 'background-hitbox' }),
      },
      '@/teams/messenger/store': { useMessengerWindowStore: () => state },
      '@/features/settings/store': {
        useSettingsStore: () => ({ backgroundDimOpacity: 50 }),
      },
      '@/consts.ts': { isGameOverlay: false },
      '@/electron/events/renderer': { emitIPCGameOverlayStopIntercept() {} },
    },
    { window, document, setTimeout, clearTimeout },
    script.content,
  ).default
  const layout = {
    setup:
      (_: unknown, { slots }: any) =>
      () =>
        vue.h('div', slots.default?.()),
  }
  const inputComponent =
    withInput &&
    loadTypescript(
      inputFilename,
      {
        vue,
        '@/styled-system/css': { css: () => '' },
        '@packages/ui': { NvButton: layout, NvCard: layout, NvGroup: layout },
        '@/teams/messenger/store': { useMessengerWindowStore: () => state },
        '@/features/settings/store': { useSettingsStore: () => ({}) },
        '@/features/speech/store': { useSpeechStore: () => ({ commands: [] }) },
        '@/electron/events/renderer': {
          emitIPCGameOverlayStopIntercept() {},
          emitIPCSay() {},
        },
        '@/services': { socket: { emit() {} } },
        '@/consts.ts': { isGameOverlay: false },
        '@vueuse/core': { useEventListener },
        '@/features/speech/components/inputs/NvSpeechEngineInput.vue': {
          inheritAttrs: false,
          setup(_: unknown, { expose, emit }: any) {
            const input = vue.ref<HTMLInputElement>()
            expose({
              get input() {
                return input.value
              },
            })
            return () =>
              vue.h('input', {
                ref: input,
                'data-test': 'message-input',
                onFocus: () => emit('focus'),
                onBlur: () => emit('blur'),
              })
          },
        },
      },
      { window },
      inputScript.content,
    ).default
  const wrapper = mount(
    withInput
      ? {
          render: () => vue.h('div', [vue.h(component), vue.h(inputComponent)]),
        }
      : component,
    {
      attachTo: document.body,
      global: { provide: { 'offscreen-focus-fix': vue.ref(null) } },
    },
  )
  wrappers.push(wrapper)
  const element = (
    withInput ? wrapper.get('.fixture-backdrop').element : wrapper.element
  ) as HTMLElement
  const focus = async (value: boolean) => {
    state.isInputFocused = value
    await vue.nextTick()
    gsap.ticker.sleep()
  }
  const advance = async (milliseconds: number) => {
    vi.advanceTimersByTime(milliseconds)
    await vue.nextTick()
    gsap.ticker.sleep()
  }
  const animate = (progress: number) => {
    const tweens = gsap.getTweensOf(element)
    tweens[tweens.length - 1].progress(progress)
    gsap.ticker.sleep()
    return Number(element.style.opacity)
  }
  return { wrapper, element, state, focus, advance, animate }
}

function coupledFixture() {
  const f = fixture(true)
  const native = new EventEmitter()
  let visible = false
  const deliveries: (() => void)[] = []
  const frames: FrameRequestCallback[] = []
  Object.assign(native, {
    isVisible: () => visible,
    isDestroyed: () => false,
    show: () => {
      visible = true
    },
    hide: () => {
      visible = false
    },
    focus: () => {
      native.emit('focus')
      window.dispatchEvent(new Event('focus'))
      f.state.isFocused = true
    },
    blur: () => {
      window.dispatchEvent(new Event('blur'))
      f.state.isFocused = false
    },
    setFocusable() {},
    setIgnoreMouseEvents() {},
    webContents: {
      executeJavaScript(source: string) {
        return new Promise((resolve, reject) =>
          deliveries.push(() => {
            try {
              resolve(
                runInNewContext(source, {
                  window,
                  document,
                  Event,
                  CustomEvent,
                  requestAnimationFrame: (fn: FrameRequestCallback) =>
                    frames.push(fn),
                }),
              )
            } catch (error) {
              reject(error)
            }
          }),
        )
      },
    },
  })
  const { ElectronMessengerWindow } = loadTypescript(
    resolve(dirname(filename), '../modules/electron-messenger-window/index.ts'),
    {
      '@/modules/electron-window-manager': {
        getInstanceByName: () => ({ window: native }),
      },
      '@/modules/node-mouse': {},
      electron: {},
      '@/teams/messenger/store': {},
      '@/features/settings/store': {},
      '@/modules/vue-hitboxes/hitboxes.store': {},
      '@packages/toolbox': {
        Deferred: () => ({ promise: new Promise(() => {}) }),
      },
      '@/utils/electron-window': { getNativeWindowHandleInt: () => 1 },
      '@/electron/game-overlay.ts': { isProcessHooked: () => false },
      forcefocus: { focusWindow() {} },
      koffi: { load: () => ({ func: () => () => 2 }) },
      '@/modules/electron-dialog': { dialogsMap: new Map() },
      '@/features/display/utils': {},
    },
    { setTimeout, clearTimeout },
  )
  const controller = ElectronMessengerWindow()
  const drain = async () => {
    for (let i = 0; i < 12; i++) await Promise.resolve()
    await vue.nextTick()
  }
  const deliver = async () => {
    deliveries.shift()?.()
    await drain()
  }
  const paint = async (count = 2) => {
    for (let i = 0; i < count; i++) {
      frames.splice(0).forEach((fn) => fn(0))
      await drain()
    }
  }
  return {
    ...f,
    controller,
    deliver,
    drain,
    paint,
    deliveries,
    visible: () => visible,
  }
}

describe('messenger backdrop animation interruptions', () => {
  it('rejects a prepare-hide script delivered after a newer native focus', async () => {
    const f = coupledFixture()
    // focus() intentionally never settles; await the observable renderer tick instead.
    f.controller.focus('keyboard')
    await f.drain()
    f.animate(0.6)
    const hiding = f.controller.hide()
    await f.drain()
    expect(f.deliveries).toHaveLength(1)
    f.controller.focus('keyboard')
    await f.drain()
    const activatedOpacity = f.animate(0.7)
    expect(activatedOpacity).toBeGreaterThan(0)
    await f.deliver()
    await f.paint()
    // Native generation guards alone cannot undo the stale renderer side effect.
    expect
      .soft(Number(f.element.style.opacity))
      .toBeCloseTo(activatedOpacity, 3)
    await f.focus(false)
    await f.focus(true)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(true)
    await f.advance(250)
    await hiding
    expect(f.visible()).toBe(true)
  })
  it('rejects late delivery after the 250ms fallback and reactivation', async () => {
    const f = coupledFixture()
    f.controller.focus('keyboard')
    await f.drain()
    f.animate(0.6)
    const hiding = f.controller.hide()
    await f.drain()
    await f.advance(249)
    expect(f.visible()).toBe(true)
    await f.advance(1)
    await hiding
    expect(f.visible()).toBe(false)
    f.controller.focus('keyboard')
    await f.drain()
    const opacity = f.animate(0.7)
    await f.deliver()
    await f.paint()
    expect(Number(f.element.style.opacity)).toBeCloseTo(opacity, 3)
    await f.focus(false)
    await f.focus(true)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(true)
    expect(f.visible()).toBe(true)
    expect(f.deliveries).toHaveLength(0)
  })

  it.each([false, true])(
    'invalidates a validated preparation when focus precedes final script delivery (timed out: %s)',
    async (timedOut) => {
      const f = coupledFixture()
      f.controller.focus('keyboard')
      await f.drain()
      const hiding = f.controller.hide()
      await f.drain()
      await f.deliver()
      expect(f.deliveries).toHaveLength(1)
      if (timedOut) {
        await f.advance(250)
        await hiding
        expect(f.visible()).toBe(false)
      }
      f.controller.focus('keyboard')
      await f.drain()
      const opacity = f.animate(0.7)
      await f.deliver()
      await f.paint()
      await hiding
      expect(Number(f.element.style.opacity)).toBeCloseTo(opacity, 3)
      await f.focus(false)
      await f.focus(true)
      expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(
        true,
      )
      expect(f.visible()).toBe(true)
    },
  )

  it('clears a valid preparation despite delayed renderer blur and waits for two paints', async () => {
    const f = coupledFixture()
    f.controller.focus('keyboard')
    await f.drain()
    f.animate(0.7)
    // Keep renderer focus/DOM state stale while main performs the real blur call.
    const suppressBlur = (event: Event) => event.stopImmediatePropagation()
    window.addEventListener('blur', suppressBlur, true)
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    try {
      const hiding = f.controller.hide()
      await f.drain()
      await f.deliver()
      await f.deliver()
      expect(Number(f.element.style.opacity)).toBe(0)
      expect(f.visible()).toBe(true)
      await f.paint(1)
      expect(f.visible()).toBe(true)
      await f.paint(1)
      await hiding
      expect(f.visible()).toBe(false)
    } finally {
      window.removeEventListener('blur', suppressBlur, true)
    }
  })

  it('paints transparent before native hide and ignores late input focus until reactivated', async () => {
    const f = fixture()
    await f.focus(true)
    f.animate(0.7)
    window.dispatchEvent(new Event('nv-messenger-prepare-hide'))
    expect(Number(f.element.style.opacity)).toBe(0)
    await vue.nextTick()
    await f.focus(false)
    await f.focus(true)
    expect(Number(f.element.style.opacity)).toBe(0)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(false)
    window.dispatchEvent(new Event('focus'))
    await vue.nextTick()
    expect(f.animate(0.2)).toBeGreaterThan(0)
  })

  it('clears a suspended fade while hidden and starts a shortcut fade before the shared focus update', async () => {
    let visibility: DocumentVisibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility,
    )
    const f = fixture()
    await f.focus(true)
    f.animate(0.7)
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    expect(Number(f.element.style.opacity)).toBe(0)
    await f.focus(false)

    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
    await vue.nextTick()
    expect(f.state.isInputFocused).toBe(false)
    expect(f.animate(0.2)).toBeGreaterThan(0)
    await f.focus(true)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(true)
  })

  it('stays transparent on native mouse activation before its shared focus update arrives', async () => {
    let visibility: DocumentVisibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility,
    )
    const f = fixture()
    await f.focus(true)
    f.animate(1)
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    await f.focus(false)
    f.state.focusContext = 'mouse'
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
    await vue.nextTick()
    expect(f.state.isFocused).toBe(false)
    expect(Number(f.element.style.opacity)).toBe(0)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(false)
  })

  it('keeps deliberate input dimming when mouse movement changes the focus context', async () => {
    const f = fixture(true)
    f.state.isFocused = true
    await vue.nextTick()
    const beforeMouseMove = f.animate(0.6)
    f.state.focusContext = 'mouse'
    await vue.nextTick()
    expect(f.state.isInputFocused).toBe(true)
    expect(Number(f.element.style.opacity)).toBeCloseTo(beforeMouseMove, 3)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(true)
  })

  it('does not restore keyboard dimming on mouse activation, but permits a deliberate input click', async () => {
    const f = fixture(true)
    const input = f.wrapper.get('[data-test=message-input]')
      .element as HTMLInputElement
    f.state.isFocused = true
    await vue.nextTick()
    expect(document.activeElement).toBe(input)
    f.animate(0.7)

    // Native blur arrives before the shared window-store notification.
    window.dispatchEvent(new Event('blur'))
    expect(document.activeElement).not.toBe(input)
    expect(f.state.isInputFocused).toBe(false)
    f.state.isFocused = false
    await vue.nextTick()
    f.animate(0.2)

    f.state.focusContext = 'mouse'
    f.state.isFocused = true
    await vue.nextTick()
    expect(document.activeElement).not.toBe(input)
    expect(Number(f.element.style.opacity)).toBe(0)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(false)

    input.focus()
    await vue.nextTick()
    expect(f.animate(0.3)).toBeGreaterThan(0)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(true)
  })

  it('does not let a delayed hide clear a newly focused backdrop', async () => {
    const f = fixture()
    await f.focus(true)
    f.animate(0.4)
    await f.focus(false)
    await f.advance(50)
    await f.focus(true)
    await f.advance(100)
    expect(f.wrapper.find('[data-test=background-hitbox]').exists()).toBe(true)
  })

  it('reverses an unfinished fade using one animation from the current opacity', async () => {
    const f = fixture()
    await f.focus(true)
    f.animate(0.5)
    await f.focus(false)
    await f.advance(100)
    const fadingOut = f.animate(0.3)
    await f.focus(true)
    expect(Number(f.element.style.opacity)).toBeCloseTo(fadingOut, 3)
    const fadingIn = f.animate(0.2)
    expect(fadingIn).toBeGreaterThan(fadingOut)
    expect(gsap.getTweensOf(f.element)).toHaveLength(1)
  })

  it('fades on window blur without jumping immediately to transparent', async () => {
    const f = fixture()
    await f.focus(true)
    const beforeBlur = f.animate(0.5)
    window.dispatchEvent(new Event('blur'))
    expect(Number(f.element.style.opacity)).toBeCloseTo(beforeBlur, 3)
    await vue.nextTick()
    const fadingOut = f.animate(0.2)
    expect(fadingOut).toBeGreaterThan(0)
    expect(fadingOut).toBeLessThan(beforeBlur)
  })

  it('disposes an active animation when the backdrop unmounts', async () => {
    const f = fixture()
    await f.focus(true)
    f.animate(0.4)
    f.wrapper.unmount()
    wrappers.splice(wrappers.indexOf(f.wrapper), 1)
    expect(gsap.getTweensOf(f.element)).toHaveLength(0)
  })
})
