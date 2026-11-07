// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
execFileSync(process.execPath, [resolve(here, 'build-client.mjs')], {
  stdio: 'pipe',
})
const clientPath = '../../../coverage/ui-client/test-client.js'
const ui = await import(/* @vite-ignore */ clientPath)
const wrappers: VueWrapper[] = []
const imports: Record<string, unknown> = {
  vue: Vue,
  '@packages/ui': ui,
  '@/styled-system/css': { css: () => '' },
  '@/modules/speech-engine-manager': {
    getEngineById: () => ({ commands: () => [] }),
  },
  '@/features/messages/store': {
    useMessagesStore: () => ({ history: [], reversedHistory: [] }),
  },
  '@/features/speech/store': {
    useSpeechStore: () => ({
      customCommands: [{ value: 'wave', description: 'Wave' }],
    }),
  },
}
function compile(file: string) {
  const filename = resolve(here, '../../../apps/app/src', file)
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
  new Function('require', 'module', 'exports', code)(
    (id: string) => (Object.hasOwn(imports, id) ? imports[id] : require(id)),
    module,
    module.exports,
  )
  return module.exports.default
}
const Input = compile(
  'features/speech/components/inputs/NvSpeechEngineInput.vue',
)
const Links = compile('teams/messenger/components/NvMessengerLinksBar.vue')
function render(component: Vue.Component) {
  const wrapper = mount(component, {
    attachTo: document.body,
    global: {
      provide: {
        theme: ui.themes.get('dark'),
        [ui.PORTAL_TARGET]: document.body,
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
async function settle() {
  await Vue.nextTick()
  await new Promise((done) => setTimeout(done, 50))
  await flushPromises()
}
function editor(value = '') {
  const model = Vue.ref(value)
  const entered = vi.fn()
  const wrapper = render({
    setup: () => () =>
      Vue.h(Input, {
        engine: 'test',
        voice: 'test',
        modelValue: model.value,
        'onUpdate:modelValue': (value: string) => {
          model.value = value
        },
        onEnter: entered,
      }),
  })
  return { wrapper, model, entered }
}
async function key(input: HTMLElement, key: string, shiftKey = false) {
  const event = new KeyboardEvent('keydown', {
    key,
    shiftKey,
    bubbles: true,
    cancelable: true,
  })
  input.dispatchEvent(event)
  await settle()
  return event
}
beforeEach(() => {
  const rect = new DOMRect(0, 0, 300, 40)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    rect,
  ] as any)
  for (const name of ['ResizeObserver', 'IntersectionObserver'])
    vi.stubGlobal(
      name,
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('renders the four messenger links as single native keyboard targets', async () => {
  const wrapper = render(Links)
  await settle()
  const links = wrapper.findAll('a[href]')
  expect(links).toHaveLength(4)
  expect(wrapper.findAll('button, [tabindex]')).toHaveLength(0)
  for (const link of links) {
    expect((link.element as HTMLElement).tabIndex).toBe(0)
    expect(link.attributes('aria-label')).toBeTruthy()
  }
})

it.each(['', 'Hello'])(
  'lets Tab and Shift+Tab leave the editor with %j text',
  async (value) => {
    const { wrapper, model } = editor(value)
    const input = wrapper.get('input').element as HTMLInputElement
    input.focus()
    await settle()
    expect((await key(input, 'Tab')).defaultPrevented).toBe(false)
    expect((await key(input, 'Tab', true)).defaultPrevented).toBe(false)
    expect(model.value).toBe(value)
  },
)

it('completes a visible slash command with Tab while Shift+Tab can leave without selecting', async () => {
  const { wrapper, model, entered } = editor('/')
  const input = wrapper.get('input').element as HTMLInputElement
  input.focus()
  await settle()
  expect(document.querySelector('.autocomplete')).not.toBeNull()
  expect((await key(input, 'Tab', true)).defaultPrevented).toBe(false)
  expect(model.value).toBe('/')
  expect((await key(input, 'Tab')).defaultPrevented).toBe(true)
  expect(model.value).toBe('/wave ')
  expect(document.activeElement).toBe(input)
  expect(document.querySelector('.autocomplete')).toBeNull()
  expect(entered).not.toHaveBeenCalled()
  await key(input, 'Enter')
  expect(entered).toHaveBeenCalledOnce()
})

it('closes command suggestions on blur without consuming another control’s Tab', async () => {
  const { wrapper, model } = editor('/')
  const input = wrapper.get('input').element as HTMLInputElement
  const next = document.createElement('button')
  document.body.append(next)
  input.focus()
  await settle()
  expect(document.querySelector('.autocomplete')).not.toBeNull()
  next.focus()
  await settle()
  expect(document.querySelector('.autocomplete')).toBeNull()
  expect((await key(next, 'Tab')).defaultPrevented).toBe(false)
  expect(model.value).toBe('/')
})
