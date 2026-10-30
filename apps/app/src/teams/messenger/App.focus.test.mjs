import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { compileScript, parse } from '@vue/compiler-sfc'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
for (const name of [
  'window',
  'document',
  'Element',
  'HTMLElement',
  'SVGElement',
  'Node',
]) {
  globalThis[name] = dom.window[name]
}
const warmupInput = document.createElement('input')
document.body.append(warmupInput)
warmupInput.focus()
warmupInput.blur()
warmupInput.remove()
const vue = await import('vue')
const { mount } = await import('@vue/test-utils')
const vueuse = await import('@vueuse/core')
const layout = {
  setup:
    (_, { slots }) =>
    () =>
      vue.h('div', slots.default?.()),
}

function compile(path, imports) {
  const filename = fileURLToPath(new URL(path, import.meta.url))
  const { descriptor, errors } = parse(readFileSync(filename, 'utf8'), {
    filename,
  })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, {
    id: filename,
    inlineTemplate: true,
  })
  return loadTypescript(
    filename,
    { vue, ...imports },
    { window },
    script.content,
  ).default
}

async function fixture(t, mode = 'experimental', late = false) {
  const calls = { clicks: 0, osFocus: 0, hide: 0, events: [] }
  const listeners = new Set()
  const add = window.addEventListener
  const remove = window.removeEventListener
  window.addEventListener = function (type, listener, options) {
    if (type === 'focus' || type === 'blur') listeners.add(listener)
    return add.call(this, type, listener, options)
  }
  window.removeEventListener = function (type, listener, options) {
    if (type === 'focus' || type === 'blur') listeners.delete(listener)
    return remove.call(this, type, listener, options)
  }

  const click = () => calls.clicks++
  document.addEventListener('click', click)
  const oldFocus = window.focus
  window.focus = () => calls.osFocus++
  window.ElectronMessengerWindow = {
    hide: () => calls.hide++,
    zoomIn() {},
    zoomOut() {},
    resetZoom() {},
  }
  const settings = vue.reactive({
    theme: 'test',
    runAsAdmin: true,
    clearMessageOnWindowHide: true,
  })
  const store = vue.reactive({
    isFocused: false,
    isShown: true,
    focusContext: 'keyboard',
    position: {},
    $patch(value) {
      Object.assign(this, value)
    },
  })
  const ready = vue.ref(!late)
  // Speech/provider boundary only: expose the actual, possibly late DOM input ref.
  const speechInput = vue.defineComponent({
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue', 'focus', 'blur'],
    setup(props, { expose, emit }) {
      const input = vue.ref()
      expose({ input })
      return () =>
        ready.value
          ? vue.h('input', {
              ref: input,
              value: props.modelValue,
              onInput: (e) => emit('update:modelValue', e.target.value),
              onFocus: () => emit('focus'),
              onBlur: () => emit('blur'),
            })
          : null
    },
  })
  const common = {
    '@/consts.ts': {
      isGameOverlay: mode !== 'desktop',
      isExperimentalGameOverlay: mode === 'experimental',
    },
    '@/teams/messenger/store': {
      useMessengerStore: () => store,
      useMessengerWindowStore: () => store,
    },
    '@/features/settings/store': { useSettingsStore: () => settings },
    '@/services': { socket: { emit: (...args) => calls.events.push(args) } },
    '@packages/ui': {
      NvButton: layout,
      NvCard: layout,
      NvGroup: layout,
      tokens: {},
      themes: new Map([['test', {}]]),
      GlobalStyles: layout,
      PORTAL_TARGET: 'portal',
    },
  }
  const inputBar = compile('./components/NvMessengerInputBar.vue', {
    ...common,
    '@vueuse/core': vueuse,
    '@/features/speech/store': { useSpeechStore: () => ({ commands: [] }) },
    '@/features/speech/components/inputs/NvSpeechEngineInput.vue': speechInput,
    '@/electron/events/renderer': {
      emitIPCGameOverlayStopIntercept() {},
      emitIPCSay() {},
    },
  })
  const app = compile('./App.vue', {
    ...common,
    'vue3-styled-components': { ThemeProvider: layout },
    '@/teams/messenger/components/NvMessenger.vue': inputBar,
    '@/teams/messenger/components/NvBackground.vue': layout,
    '@/teams/messenger/components/NvDebug.vue': layout,
    '@/features/databases/store': {
      useDatabasesStore: () => ({ $whenReady: async () => {}, databases: [] }),
    },
    '@/features/game-overlay/store': { useGameOverlayStore: () => ({}) },
    '@/electron/events/renderer.ts': { onIPCApplyProfile() {} },
    '@/features/profiles/store.ts': { useProfilesStore: () => ({}) },
    '@root/package.json': { repository: 'owner/repo' },
  })
  const wrapper = mount(app, { attachTo: document.body })
  let unmounted = false
  const unmount = () => {
    if (!unmounted) {
      wrapper.unmount()
      unmounted = true
    }
  }
  t.after(() => {
    unmount()
    document.removeEventListener('click', click)
    window.focus = oldFocus
    window.addEventListener = add
    window.removeEventListener = remove
    assert.equal(
      listeners.size,
      0,
      'owned focus/blur listeners are removed on unmount',
    )
  })
  await vue.nextTick()
  async function event(name) {
    window.dispatchEvent(new window.Event(name))
    await vue.nextTick()
  }
  return { wrapper, calls, ready, settings, store, event, unmount }
}

test('experimental focuses a late input ref without a window focus event', async (t) => {
  const f = await fixture(t, 'experimental', true)
  await f.event('focus')
  await f.event('blur')
  f.ready.value = true
  await vue.nextTick()
  assert.equal(document.activeElement, f.wrapper.get('input').element)
  assert.equal(f.calls.clicks, 0)
  assert.equal(f.calls.osFocus, 0)
})

for (const mode of ['experimental', 'legacy']) {
  test(`${mode} preserves repeated window blur/refocus and clear-message settings`, async (t) => {
    const f = await fixture(t, mode)
    const input = f.wrapper.get('input')
    for (const clear of [false, true]) {
      f.settings.clearMessageOnWindowHide = clear
      await input.setValue('keep or clear')
      await f.event('blur')
      assert.notEqual(document.activeElement, input.element)
      assert.equal(input.element.value, clear ? '' : 'keep or clear')
      await f.event('focus')
      assert.equal(document.activeElement, input.element)
      f.store.isShown = false
      await vue.nextTick()
      assert.equal(input.element.value, clear ? '' : 'keep or clear')
      f.store.isShown = true
      await vue.nextTick()
    }
    assert.equal(f.calls.clicks, 0)
    assert.equal(f.calls.osFocus, 0)
    assert.ok(f.calls.events.some(([event]) => event === 'input:focus'))
    assert.ok(f.calls.events.some(([event]) => event === 'input:blur'))
    f.unmount()
    const events = f.calls.events.length
    await f.event('focus')
    await f.event('blur')
    assert.equal(f.calls.events.length, events)
  })
}

test('legacy keeps the full-screen button, click-focus hook and blur rearm', async (t) => {
  const f = await fixture(t, 'legacy')
  const button = f.wrapper.get('[data-offscreen-focus-fix]')
  const input = f.wrapper.get('input')
  assert.notEqual(document.activeElement, input.element)
  assert.ok(button.classes().includes('fixed'))
  assert.ok(button.classes().includes('inset-0'))
  assert.equal(button.element.style.display, '')
  await button.trigger('click')
  assert.equal(button.element.style.display, 'none')
  assert.equal(document.activeElement, input.element)
  await f.event('blur')
  assert.equal(button.element.style.display, '')
  await button.trigger('click')
  assert.equal(document.activeElement, input.element)
  assert.equal(f.calls.clicks, 2)
  assert.equal(f.calls.osFocus, 0)
})

test('desktop keeps its hidden legacy DOM but never shows the screen button or forces initial focus', async (t) => {
  const f = await fixture(t, 'desktop')
  const input = f.wrapper.get('input')
  assert.equal(
    f.wrapper.get('[data-offscreen-focus-fix]').element.style.display,
    'none',
  )
  assert.notEqual(document.activeElement, input.element)
  await f.event('focus')
  await f.event('blur')
  assert.notEqual(document.activeElement, input.element)
  assert.equal(
    f.wrapper.get('[data-offscreen-focus-fix]').element.style.display,
    'none',
  )
  assert.equal(f.calls.clicks, 0)
  assert.equal(f.calls.osFocus, 0)
  f.store.isFocused = true
  await vue.nextTick()
  assert.equal(document.activeElement, input.element)
})

test('experimental focuses the first real input without a click or window focus event', async (t) => {
  const f = await fixture(t)
  assert.equal(document.activeElement, f.wrapper.get('input').element)
  assert.equal(f.calls.clicks, 0)
  assert.equal(f.calls.osFocus, 0)
})

test('experimental omits the giant focus button initially and after blur', async (t) => {
  const f = await fixture(t)
  assert.equal(f.wrapper.find('[data-offscreen-focus-fix]').exists(), false)
  await f.event('blur')
  assert.equal(f.wrapper.find('[data-offscreen-focus-fix]').exists(), false)
})
