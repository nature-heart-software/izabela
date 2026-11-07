// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const engines = resolve(here, '../../../apps/app/src/plugins/speech-engines')
// Discover every provider so newly added voice selectors receive this coverage too.
const providers = readdirSync(engines).filter((name) => {
  try {
    return readFileSync(
      resolve(engines, name, 'NvVoiceSelect.vue'),
      'utf8',
    ).includes('favoriteVoiceIds')
  } catch {
    return false
  }
})
execFileSync(process.execPath, [resolve(here, 'build-client.mjs')], {
  stdio: 'pipe',
})
const clientPath = '../../../coverage/ui-client/test-client.js'
const ui = await import(/* @vite-ignore */ clientPath)
const wrappers: VueWrapper[] = []

function evaluateModule(source: string, imports: Record<string, unknown>) {
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} as any }
  new Function('require', 'module', 'exports', code)(
    (id: string) => (Object.hasOwn(imports, id) ? imports[id] : require(id)),
    module,
    module.exports,
  )
  return module.exports
}
const selectUtils = evaluateModule(
  readFileSync(resolve(here, '../../../apps/app/src/utils/select.ts'), 'utf8'),
  {},
)
const voice = (name: string) => ({
  name,
  Name: name,
  Id: name,
  voiceId: name,
  voice_id: name,
})
function renderProvider(provider: string, initiallyFavorite: boolean) {
  const target = provider === 'animalese' ? 'Alpha' : 'Beta'
  const initial =
    provider === 'say'
      ? 'Alpha'
      : voice(provider === 'animalese' ? 'Custom' : 'Alpha')
  const state = Vue.reactive<Record<string, any>>({
    selectedVoice: initial,
    favoriteVoiceIds: initiallyFavorite ? [target] : [],
  })
  const setProperty = vi.fn((key: string, value: unknown) => {
    state[key] = value
  })
  // Only catalog/network and persisted state boundaries are controlled. The provider
  // template, grouping, virtual list, favorite button and combobox are production code.
  const engine = { hasCredentials: () => true, getCredentials: () => ({}) }
  const imports = {
    vue: Vue,
    '@packages/ui': ui,
    '@packages/toolbox': {
      purify: (value: unknown) => JSON.parse(JSON.stringify(value)),
    },
    '@/utils/select': selectUtils,
    '@/consts.ts': { isGameOverlay: false },
    '@/features/speech/store': { useSpeechStore: () => ({}) },
    '@/features/settings/store': { useSettingsStore: () => ({}) },
    'vue-query': { useQueryClient: () => ({ refetchQueries: vi.fn() }) },
    './register': { engine },
    './register.ts': { engine },
    './store': { getProperty: (key: string) => state[key], setProperty },
    './hooks': {
      useListVoicesQuery: () => ({
        data: Vue.ref(
          provider === 'say'
            ? ['Alpha', 'Beta']
            : [voice('Alpha'), voice('Beta')],
        ),
        isFetching: Vue.ref(false),
      }),
    },
    './shared': {
      getVoiceId: (v: any) => (typeof v === 'string' ? v : v.name),
      getVoiceName: (v: any) => (typeof v === 'string' ? v : v.name),
      getVoiceCategory: () => 'General',
      voices: [voice('Alpha'), voice('Beta')],
      defaultVoice: voice('Alpha'),
      LIST_VOICES_QUERY_KEY: 'voices',
    },
  }
  const filename = resolve(engines, provider, 'NvVoiceSelect.vue')
  const component = evaluateModule(
    compileScript(
      parse(readFileSync(filename, 'utf8'), { filename }).descriptor,
      { id: filename, inlineTemplate: true },
    ).content,
    imports,
  ).default
  const wrapper = mount(component, {
    attachTo: document.body,
    global: {
      provide: {
        theme: ui.themes.get('izabela-dark'),
        [ui.PORTAL_TARGET]: document.body,
      },
      directives: { loading: ui.loadingDirective },
    },
  })
  wrappers.push(wrapper)
  return { wrapper, state, setProperty, initial, target }
}
async function settle() {
  await Vue.nextTick()
  await new Promise((done) => setTimeout(done, 40))
  await flushPromises()
}
beforeEach(() => {
  const rect = new DOMRect(0, 0, 600, 300)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    rect,
  ] as any)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(600)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(300)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [
            {
              target,
              contentRect: rect,
              borderBoxSize: [{ inlineSize: 600, blockSize: 300 }],
            },
          ] as any,
          this as any,
        )
      }
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
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it.each(
  providers.flatMap((provider) =>
    [false, true].map((favorite) => [provider, favorite] as const),
  ),
)(
  '%s keeps the select open and voice unchanged when toggling favorite (initially %s)',
  async (provider, initiallyFavorite) => {
    const { wrapper, state, setProperty, initial, target } = renderProvider(
      provider,
      initiallyFavorite,
    )
    await settle()
    const input = wrapper.get('input').element as HTMLInputElement
    input.focus()
    input.click()
    await settle()
    const row = document.querySelector<HTMLElement>(`[title="${target}"]`)!
    row.dispatchEvent(new MouseEvent('mouseenter'))
    await settle()
    const title = initiallyFavorite
      ? 'Remove from favorites'
      : 'Add to favorites'
    const button = row.querySelector<HTMLButtonElement>(
      `button[title="${title}"]`,
    )!
    expect(button).not.toBeNull()
    // Include release and click: a mousedown-only test missed row selection and
    // list remounts midway through a real user gesture.
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
      button.dispatchEvent(
        new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }),
      )
      await settle()
      expect(
        button.isConnected,
        `${type} must not replace the click target`,
      ).toBe(true)
      expect(state.favoriteVoiceIds).toEqual(initiallyFavorite ? [target] : [])
    }
    button.click()
    await settle()
    expect(state.favoriteVoiceIds).toEqual(initiallyFavorite ? [] : [target])
    expect(
      setProperty.mock.calls.filter(([key]) => key === 'favoriteVoiceIds'),
    ).toHaveLength(1)
    expect(
      setProperty.mock.calls.filter(([key]) => key === 'selectedVoice'),
    ).toHaveLength(0)
    expect(state.selectedVoice).toEqual(initial)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(input)
    const removeButtons = document.querySelectorAll(
      'button[title="Remove from favorites"]',
    )
    expect(removeButtons).toHaveLength(initiallyFavorite ? 0 : 2)
    // The favorite action must not disable normal voice selection.
    document.querySelector<HTMLElement>(`[title="${target}"]`)!.click()
    await settle()
    expect(state.selectedVoice).toEqual(
      provider === 'say' ? target : voice(target),
    )
    expect(input.getAttribute('aria-expanded')).toBe('false')
  },
)
