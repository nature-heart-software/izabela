// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import gsap from 'gsap'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const filename = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../apps/app/src/teams/messenger/components/NvBackground.vue',
)
const source = readFileSync(filename, 'utf8')
const wrappers: VueWrapper[] = []
const timers = new Map<number, () => void>()
let timerId = 0
const listeners: Array<
  [
    string,
    EventListenerOrEventListenerObject,
    boolean | AddEventListenerOptions | undefined,
  ]
> = []
beforeEach(() => {
  const add = window.addEventListener.bind(window)
  vi.spyOn(window, 'addEventListener').mockImplementation(
    (name, listener, options) => {
      if (name === 'focus' || name === 'blur')
        listeners.push([name, listener, options])
      add(name, listener, options)
    },
  )
})
const tick = async () => {
  await Vue.nextTick()
  gsap.ticker.sleep()
}

function fixture(initiallyFocused = false, isGameOverlay = false) {
  const stopIntercept = vi.fn()
  const styles: Record<string, unknown>[] = []
  const state = Vue.reactive({
    isInputFocused: initiallyFocused,
    isShown: false,
    isFocused: false,
    focusContext: 'keyboard',
  })
  const input = document.createElement('input')
  document.body.append(input)
  input.focus()
  const compiled = compileScript(parse(source, { filename }).descriptor, {
    id: filename,
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
    gsap: { default: gsap, __esModule: true },
    '@/styled-system/css': {
      css: (style: Record<string, unknown>) => {
        styles.push(style)
        return style.opacity === 0 ? 'fixture-backdrop' : ''
      },
    },
    '@/modules/vue-hitboxes/NvHitbox.vue': {
      default: Vue.defineComponent({
        render: () => Vue.h('div', { 'data-backdrop-hitbox': '' }),
      }),
      __esModule: true,
    },
    '@/teams/messenger/store': { useMessengerWindowStore: () => state },
    '@/features/settings/store': {
      useSettingsStore: () => ({ backgroundDimOpacity: 50 }),
    },
    '@/consts.ts': { isGameOverlay },
    '@/electron/events/renderer': {
      emitIPCGameOverlayStopIntercept: stopIntercept,
    },
  }
  const scheduled = (fn: () => void) => {
    const id = ++timerId
    timers.set(id, fn)
    return id
  }
  new Function(
    'require',
    'module',
    'exports',
    'setTimeout',
    'clearTimeout',
    code,
  )(
    (id: string) => {
      if (Object.hasOwn(imports, id)) return imports[id]
      throw new Error(`Unexpected backdrop dependency: ${id}`)
    },
    module,
    module.exports,
    scheduled,
    (id: number) => timers.delete(id),
  )
  const wrapper = mount(module.exports.default, { attachTo: document.body })
  wrappers.push(wrapper)
  const element = wrapper.element as HTMLElement
  const finishFades = () => {
    for (const tween of gsap.getTweensOf(element)) tween.progress(1)
    gsap.ticker.sleep()
  }
  const flushOldHide = async () => {
    const pending = [...timers.values()]
    timers.clear()
    for (const callback of pending) callback()
    await tick()
    finishFades()
  }
  const open = async () => {
    state.isShown = true
    state.isFocused = true
    window.dispatchEvent(new Event('focus'))
    await tick()
  }
  const close = async () => {
    state.isFocused = false
    state.isShown = false
    window.dispatchEvent(new Event('blur'))
    await tick()
  }
  const assertFocusedBackdrop = () => {
    expect(document.activeElement).toBe(input)
    expect(state.isInputFocused).toBe(true)
    expect(wrapper.find('[data-backdrop-hitbox]').exists()).toBe(true)
    expect(Number(element.style.opacity)).toBe(1)
  }
  return {
    state,
    input,
    wrapper,
    element,
    finishFades,
    flushOldHide,
    open,
    close,
    assertFocusedBackdrop,
    stopIntercept,
    styles,
  }
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  for (const [name, listener, options] of listeners.splice(0)) {
    window.removeEventListener(name, listener, options)
  }
  vi.restoreAllMocks()
  timers.clear()
  gsap.globalTimeline.clear()
  gsap.ticker.sleep()
  document.body.innerHTML = ''
})

describe('application backdrop across shortcut reopen', () => {
  it('survives repeated native blur/focus in the same turn with one monotonic fade', async () => {
    const f = fixture()
    await f.open()
    f.state.isInputFocused = true
    await tick()
    f.finishFades()
    for (let cycle = 0; cycle < 5; cycle++) {
      window.dispatchEvent(new Event('blur'))
      window.dispatchEvent(new Event('focus'))
      await tick()
      expect(document.activeElement).toBe(f.input)
      const fades = gsap.getTweensOf(f.element)
      expect(fades).toHaveLength(1)
      let previous = 0
      for (const progress of [0, 0.1, 0.3, 0.6, 1]) {
        fades[0].progress(progress)
        const opacity = Number(f.element.style.opacity)
        expect(opacity).toBeGreaterThanOrEqual(previous)
        previous = opacity
      }
      await f.flushOldHide()
      f.assertFocusedBackdrop()
    }
  })

  it('retains the outside-click grace period for a genuine input blur', async () => {
    const f = fixture()
    await f.open()
    f.state.isInputFocused = true
    await tick()
    f.finishFades()
    f.state.isInputFocused = false
    await tick()
    expect(f.wrapper.find('[data-backdrop-hitbox]').exists()).toBe(true)
    expect(timers.size).toBe(1)
    await f.flushOldHide()
    expect(f.wrapper.find('[data-backdrop-hitbox]').exists()).toBe(false)
    expect(Number(f.element.style.opacity)).toBe(0)
  })

  it('does not show a backdrop for native focus without input focus', async () => {
    const f = fixture()
    await f.open()
    await f.flushOldHide()
    expect(f.wrapper.find('[data-backdrop-hitbox]').exists()).toBe(false)
  })

  it('retains the game-overlay click shield and stop-intercept action', async () => {
    const f = fixture(false, true)
    expect(f.styles.some((style) => style.opacity === 1)).toBe(true)
    const reset = vi.spyOn(gsap, 'set')
    await f.wrapper.get('[data-backdrop-hitbox]').trigger('click')
    expect(f.stopIntercept).toHaveBeenCalledOnce()
    await f.close()
    expect(f.wrapper.find('[data-backdrop-hitbox]').exists()).toBe(true)
    expect(reset).not.toHaveBeenCalled()
  })

  it('removes native listeners, pending hides and fades when unmounted', async () => {
    const f = fixture()
    await f.open()
    f.state.isInputFocused = true
    await tick()
    f.state.isInputFocused = false
    await tick()
    expect(timers.size).toBe(1)
    f.wrapper.unmount()
    wrappers.splice(wrappers.indexOf(f.wrapper), 1)
    expect(timers.size).toBe(0)
    expect(gsap.getTweensOf(f.element)).toHaveLength(0)
    const animate = vi.spyOn(gsap, 'to')
    const reset = vi.spyOn(gsap, 'set')
    window.dispatchEvent(new Event('blur'))
    window.dispatchEvent(new Event('focus'))
    expect(animate).not.toHaveBeenCalled()
    expect(reset).not.toHaveBeenCalled()
  })

  it('restores the backdrop when the input remains focused across close and reopen', async () => {
    const f = fixture()
    await f.open()
    f.state.isInputFocused = true
    await tick()
    f.finishFades()
    f.assertFocusedBackdrop()
    await f.close()
    expect(document.activeElement).toBe(f.input)
    expect(f.state.isInputFocused).toBe(true)
    await f.open()
    f.finishFades()
    f.assertFocusedBackdrop()
    await f.flushOldHide()
    f.assertFocusedBackdrop()
  })

  it('does not let the previous close timer hide a newly focused reopened backdrop', async () => {
    const f = fixture()
    await f.open()
    f.state.isInputFocused = true
    await tick()
    f.finishFades()
    await f.close()
    // The shared focus notification can arrive while the native window is
    // hidden. Once reopened, DOM and shared input focus remain true throughout.
    f.state.isInputFocused = false
    await tick()
    await f.open()
    f.state.isInputFocused = true
    await tick()
    f.finishFades()
    f.assertFocusedBackdrop()
    await f.flushOldHide()
    f.assertFocusedBackdrop()
  })
})
