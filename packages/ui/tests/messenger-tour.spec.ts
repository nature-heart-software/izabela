// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import VueJsTour from '@globalhive/vuejs-tour'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// jump.js captures the scrolling function when the real tour module loads.
vi.hoisted(() => {
  window.scrollTo = () => {}
})
const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
execFileSync(process.execPath, [resolve(here, 'build-client.mjs')], {
  stdio: 'pipe',
})
const clientPath = '../../../coverage/ui-client/test-client.js'
const ui = await import(/* @vite-ignore */ clientPath)
const filename = resolve(
  here,
  '../../../apps/app/src/teams/messenger/components/NvMessengerNavigationBar.vue',
)
const source = readFileSync(filename, 'utf8')
const imports: Record<string, unknown> = {
  vue: Vue,
  '@packages/ui': ui,
  'vue-router': { useRoute: () => ({ name: 'home' }) },
  '@/features/settings/store': {
    useSettingsStore: () => ({
      keybindings: { toggleMessengerWindow: [{ key: 'Enter' }] },
    }),
  },
  '@/consts.ts': { isGameOverlay: false },
  '@/electron/events/renderer.ts': { emitIPCGameOverlayStopIntercept: vi.fn() },
}
const module = { exports: {} as { default: Vue.Component } }
const code = ts.transpileModule(
  compileScript(parse(source, { filename }).descriptor, {
    id: filename,
    inlineTemplate: true,
  }).content,
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  },
).outputText
new Function('require', 'module', 'exports', code)(
  (id: string) => (Object.hasOwn(imports, id) ? imports[id] : require(id)),
  module,
  module.exports,
)
const wrappers: VueWrapper[] = []
async function settle() {
  await Vue.nextTick()
  await new Promise((done) => setTimeout(done, 40))
  await flushPromises()
}
beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const rect = new DOMRect(20, 20, 300, 40)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    rect,
  ] as any)
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
  const popup = document.getElementById('vjt-tooltip')
  if (popup && !popup.hasAttribute('data-hidden')) {
    const close = [...popup.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent?.trim() === 'Close',
    )
    close?.click()
  }
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  await new Promise((done) => setTimeout(done, 520))
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function renderTour() {
  // Only persisted settings and desktop APIs are controlled. The application's
  // navigation component, real VTour lifecycle and shared buttons remain real.
  const targets = [...source.matchAll(/target: '([^']+)'/g)].map(
    (match) => match[1],
  )
  for (const selector of targets) {
    if (
      selector === '[data-v-step="messages-button"]' ||
      selector === '[data-v-step="settings-button"]'
    )
      continue
    const target = document.createElement('button')
    target.setAttribute('data-v-step', selector.match(/"([^"]+)"/)![1])
    document.body.append(target)
  }
  const wrapper = mount(module.exports.default, {
    attachTo: document.body,
    global: {
      plugins: [VueJsTour],
      provide: {
        theme: ui.themes.get('dark'),
        [ui.PORTAL_TARGET]: document.body,
        messenger: { isViewShown: Vue.ref(false), navigateTo: vi.fn() },
      },
    },
  })
  wrappers.push(wrapper)
  await settle()
  const start = wrapper.get('button').element as HTMLButtonElement
  start.focus()
  start.click()
  await settle()
  return { wrapper, count: targets.length }
}
function action(label: string) {
  return [
    ...document.querySelectorAll<HTMLButtonElement>('#vjt-tooltip button'),
  ].find((button) => button.textContent?.trim() === label)!
}

it('focuses Next when the actual tour starts, advances, and goes back', async () => {
  await renderTour()
  expect(
    document.getElementById('vjt-tooltip')?.hasAttribute('data-hidden'),
  ).toBe(false)
  expect(document.activeElement).toBe(action('Next'))
  action('Next').click()
  await settle()
  expect(document.activeElement).toBe(action('Next'))
  expect(action('Previous')).toBeTruthy()
  action('Previous').click()
  await settle()
  expect(document.activeElement).toBe(action('Next'))
  expect(action('Previous')).toBeUndefined()
})

it('focuses Close on the last step and Next again when restarted', async () => {
  const { wrapper, count } = await renderTour()
  for (let index = 1; index < count; index++) {
    action('Next').click()
    await settle()
  }
  expect(action('Next')).toBeUndefined()
  expect(
    document.getElementById('vjt-tooltip')?.hasAttribute('data-hidden'),
  ).toBe(false)
  await vi.waitFor(() => expect(document.activeElement).toBe(action('Close')))
  action('Close').click()
  await settle()
  expect(
    document.getElementById('vjt-tooltip')?.hasAttribute('data-hidden'),
  ).toBe(true)
  ;(wrapper.get('button').element as HTMLButtonElement).click()
  await settle()
  expect(document.activeElement).toBe(action('Next'))
})
