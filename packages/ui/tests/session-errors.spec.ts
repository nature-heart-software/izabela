// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import * as Ark from '@ark-ui/vue'
import * as Router from 'vue-router'
import * as Floating from '@floating-ui/vue'
import { execFileSync } from 'node:child_process'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
const uiPath = '../../../coverage/ui-client/test-client.js'
execFileSync(
  process.execPath,
  [resolve('packages/ui/tests/build-client.mjs')],
  { stdio: 'pipe' },
)
const ui = await import(/* @vite-ignore */ uiPath)
const require = createRequire(import.meta.url)
const loadTypescript = require('../../../tests/load-typescript.cjs')
const managerMocks = {
  '@/modules/engine-manager': loadTypescript(
    resolve('apps/app/src/modules/engine-manager/index.ts'),
  ),
  '@/features/dictionary/store': {
    useDictionaryStore: () => ({ translateText: (text: string) => text }),
  },
}
const speechManager = loadTypescript(
  resolve('apps/app/src/modules/speech-engine-manager/index.ts'),
  managerMocks,
).default
const recognitionManager = loadTypescript(
  resolve('apps/app/src/modules/speech-recognition-engine-manager/index.ts'),
  managerMocks,
).default
const translationManager = loadTypescript(
  resolve('apps/app/src/modules/translation-engine-manager/index.ts'),
  managerMocks,
).default
const futureEngineId = '@acme/voice-v2'
const wrappers: VueWrapper[] = []
const errors = Vue.reactive({
  entries: [] as any[],
  hasOccurred: false,
  revision: 0,
  $patch(value: object) {
    Object.assign(this, value)
  },
  $whenReady: async () => {},
})
const settings = Vue.reactive({ debugMode: false })
const sessionErrors = loadTypescript(
  resolve('apps/app/src/features/session-errors/index.ts'),
  {
    '@/features/session-errors/store': { useSessionErrorsStore: () => errors },
  },
)
const { reportProviderError } = loadTypescript(
  resolve('apps/app/src/features/session-errors/report.ts'),
  { './index': { __esModule: true, ...sessionErrors } },
  {
    window: {
      ElectronSessionErrors: {
        report(entry: object) {
          sessionErrors.default.report(JSON.parse(JSON.stringify(entry)))
        },
      },
    },
  },
)
const bridgeWindow = window as unknown as Window & {
  ElectronSessionErrors: {
    read?: () => Promise<{
      entries: typeof errors.entries
      hasOccurred: boolean
      revision: number
    }>
    clear?: () => Promise<void>
  }
  ElectronMessengerWindow: { openDevTools: () => void }
}
let trackerStarts = 0,
  trackerStops = 0
const Div = Vue.defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      Vue.h('div', slots.default?.()),
})

const imports: Record<string, any> = {
  vue: Vue,
  '@ark-ui/vue': Ark,
  '@floating-ui/vue': {
    ...Floating,
    autoUpdate(...args: Parameters<typeof Floating.autoUpdate>) {
      trackerStarts++
      const stop = Floating.autoUpdate(...args)
      return () => {
        trackerStops++
        stop()
      }
    },
  },
  '@packages/ui': ui,
  '@/styled-system/css': { css: () => '' },
  '@/styled-system/patterns': {
    vstack: () => '',
    hstack: () => '',
    box: () => '',
  },
  '@/features/settings/store': { useSettingsStore: () => settings },
  '@/features/session-errors/store': { useSessionErrorsStore: () => errors },
  '@/modules/speech-engine-manager': {
    __esModule: true,
    default: speechManager,
  },
  '@/modules/speech-recognition-engine-manager': {
    __esModule: true,
    default: recognitionManager,
  },
  '@/modules/translation-engine-manager': {
    __esModule: true,
    default: translationManager,
  },
  './store': { useSessionErrorsStore: () => errors },
  '@/modules/vue-hitboxes': { hitboxClass: 'hitbox' },
  '@/utils/focus': { getTabStops: () => [] },
  'vue-router': {
    ...Router,
    useRouter: () => ({
      currentRoute: Vue.ref({ name: '' }),
      push: vi.fn(async () => {}),
    }),
  },
  'vue3-moveable': {
    __esModule: true,
    default: Vue.defineComponent({
      setup(_, { expose }) {
        expose({ updateTarget() {}, request() {} })
        return () => null
      },
    }),
  },
  '@/teams/messenger/store': {
    useMessengerStore: () => ({ $patch() {} }),
    useMessengerStateStore: () => ({ markForRestart: false }),
  },
  '@/consts.ts': { isGameOverlay: false },
}
function compile(file: string): Vue.Component {
  const filename = resolve('apps/app/src', file)
  const script = compileScript(
    parse(readFileSync(filename, 'utf8'), { filename }).descriptor,
    { id: filename, inlineTemplate: true },
  ).content
  const code = ts.transpileModule(script, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} as { default: Vue.Component } }
  new Function('require', 'module', 'exports', code)(
    (id: string) => {
      if (Object.hasOwn(imports, id)) return imports[id]
      if (id === './provider-name')
        return loadTypescript(
          resolve('apps/app/src/features/session-errors/provider-name.ts'),
          imports,
        )
      if (id.endsWith('NvErrorHistory.vue'))
        return {
          __esModule: true,
          default: compile('features/session-errors/NvErrorHistory.vue'),
        }
      if (id.endsWith('NvSessionErrorToasts.vue'))
        return {
          __esModule: true,
          default: compile('features/session-errors/NvSessionErrorToasts.vue'),
        }
      if (id.endsWith('.vue')) return { __esModule: true, default: Div }
      return require(id)
    },
    module,
    module.exports,
  )
  return module.exports.default
}
beforeEach(() => {
  speechManager.registerEngine({
    id: futureEngineId,
    name: 'Future Voice Plugin',
  })
  recognitionManager.registerEngine(futureEngineId, {
    id: futureEngineId,
    name: 'Future Recognition Plugin',
  })
  translationManager.registerEngine(futureEngineId, {
    id: futureEngineId,
    name: 'Future Translation Plugin',
  })
  trackerStarts = 0
  trackerStops = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(
    function (this: HTMLElement) {
      return [this.getBoundingClientRect()] as any
    },
  )
})
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  errors.entries = []
  errors.hasOccurred = false
  settings.debugMode = false
})
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
it('shows new session errors as dismissible Ark toasts without stealing editor focus or deleting history', async () => {
  bridgeWindow.ElectronSessionErrors = {
    read: vi.fn(async () => ({ entries: [], hasOccurred: false, revision: 0 })),
  } as any
  const portal = document.createElement('div')
  document.body.append(portal)
  const wrapper = mount(compile('teams/messenger/components/NvMessenger.vue'), {
    attachTo: document.body,
    global: {
      stubs: { RouterView: Div },
      provide: {
        theme: ui.themes.get('dark'),
        'router-overlay': Vue.ref(portal),
        [ui.PORTAL_TARGET]: document.body,
      },
    },
  })
  wrappers.push(wrapper)
  await flushPromises()
  const editor = document.createElement('input')
  document.body.append(editor)
  editor.focus()
  reportProviderError(
    Object.assign(Error('PRIVATE_ERROR_MESSAGE'), {
      code: 'ECONNRESET',
      headers: { Authorization: 'PRIVATE_HEADER' },
      config: { data: 'PRIVATE_REQUEST_BODY' },
    }),
    'speech',
    futureEngineId,
  )
  await flushPromises()
  expect(
    document.querySelector('[data-scope="toast"][data-part="root"]'),
  ).not.toBeNull()
  expect(document.body.textContent).toContain('Connection error')
  expect(document.body.textContent).toContain('Speech · Future Voice Plugin')
  expect(document.body.textContent).not.toContain(futureEngineId)
  expect(document.body.textContent).not.toMatch(/PRIVATE_|Authorization/)
  expect(document.body.textContent).not.toContain('Future Recognition Plugin')
  expect(document.body.textContent).not.toContain('Future Translation Plugin')
  expect(document.activeElement).toBe(editor)
  const dismiss = document.querySelector<HTMLButtonElement>(
    '[aria-label="Dismiss notification"]',
  )!
  expect(dismiss).not.toBeNull()
  dismiss.click()
  await flushPromises()
  expect(errors.entries.length).toBe(1)
})
it('shows the newest error even when three notifications are already visible and retains every history entry', async () => {
  bridgeWindow.ElectronSessionErrors = {
    read: vi.fn(async () => ({ entries: [], hasOccurred: false, revision: 0 })),
  } as any
  const portal = document.createElement('div')
  document.body.append(portal)
  const wrapper = mount(
    compile('features/session-errors/NvSessionErrorToasts.vue'),
    {
      global: {
        provide: {
          theme: ui.themes.get('dark'),
          'router-overlay': Vue.ref(portal),
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  for (let id = 1; id <= 4; id++) {
    errors.entries = [
      ...errors.entries,
      {
        id: String(id),
        category: 'other',
        operation: 'speech',
        provider: [
          'unregistered-plugin',
          'https://private.example/token',
          'private credential',
          futureEngineId,
        ][id - 1],
        createdAt: '2026-01-01T12:00:00Z',
      },
    ]
    await flushPromises()
  }
  expect(document.body.textContent).not.toMatch(/unregistered-plugin|private/)
  expect(document.body.textContent).toContain('Future Voice Plugin')
  expect(document.getElementById('toast:session-error-4')).not.toBeNull()
  expect(document.getElementById('toast:session-error-1')).toBeNull()
  expect(errors.entries.length).toBe(4)
})

it('tracks a moving anchor only while toast surfaces are active', async () => {
  bridgeWindow.ElectronSessionErrors = {
    read: vi.fn(async () => ({ entries: [], hasOccurred: false, revision: 0 })),
  } as any
  const portal = document.createElement('div')
  const anchor = document.createElement('div')
  document.body.append(portal, anchor)
  const wrapper = mount(
    compile('features/session-errors/NvSessionErrorToasts.vue'),
    {
      props: { anchor },
      global: {
        provide: {
          theme: ui.themes.get('dark'),
          'router-overlay': Vue.ref(portal),
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  expect(trackerStarts).toBe(0)
  errors.entries = [
    {
      id: '3',
      category: 'other',
      operation: 'speech',
      createdAt: '2026-01-01T12:00:00Z',
    },
  ]
  await flushPromises()
  expect(trackerStarts).toBeGreaterThan(0)
  errors.entries = []
  await flushPromises()
  expect(trackerStops).toBe(trackerStarts)
})

it('restores main-process session history on renderer reload without replaying toasts or echoing an old snapshot to main', async () => {
  const entry = {
    id: '12',
    category: 'connection',
    operation: 'speech',
    createdAt: '2026-01-01T12:00:00Z',
  }
  bridgeWindow.ElectronSessionErrors = {
    read: vi.fn(async () => ({
      entries: [entry],
      hasOccurred: true,
      revision: 12,
    })),
  } as any
  const patch = vi.spyOn(errors, '$patch')
  const portal = document.createElement('div')
  document.body.append(portal)
  const wrapper = mount(
    compile('features/session-errors/NvSessionErrorToasts.vue'),
    {
      global: {
        provide: {
          theme: ui.themes.get('dark'),
          'router-overlay': Vue.ref(portal),
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  expect(errors.entries).toEqual([entry])
  expect(errors.hasOccurred).toBe(true)
  expect(
    document.querySelector('[data-scope="toast"][data-part="root"]'),
  ).toBeNull()
  expect(patch).not.toHaveBeenCalled()
})

it('opens error history with safe categories and clears entries without removing the session action', async () => {
  errors.hasOccurred = true
  const entries = [
    ...['speech', 'speech-recognition', 'translation', 'provider'].map(
      (operation, index) => ({
        id: String(index),
        category: 'subscription',
        operation,
        provider: futureEngineId,
        createdAt: '2026-01-01T12:00:00Z',
      }),
    ),
    ...[
      'unregistered-plugin',
      'https://private.example/token',
      'private credential',
    ].map((provider, index) => ({
      id: `unknown-${index}`,
      category: 'other',
      operation: 'translation',
      provider,
      createdAt: '2026-01-01T12:00:00Z',
    })),
  ]
  for (const entry of entries)
    reportProviderError(
      { status: entry.category === 'subscription' ? 402 : 403 },
      entry.operation,
      entry.provider,
    )
  bridgeWindow.ElectronSessionErrors = {
    clear: vi.fn(async () => {
      errors.entries = []
    }),
  } as any
  const wrapper = render(compile('features/session-errors/NvErrorHistory.vue'))
  await wrapper.get('[aria-label="Error history"]').trigger('click')
  await flushPromises()
  expect(document.body.textContent).toContain('Subscription error')
  expect(document.body.textContent).toContain('Translation')
  const rows = [
    ...document.querySelectorAll('[aria-label="Session errors"] li'),
  ].map((row) => row.textContent)
  expect(
    rows.filter((row) => row?.includes('Future Translation Plugin')),
  ).toHaveLength(1)
  expect(
    rows.filter((row) => row?.includes('Future Recognition Plugin')),
  ).toHaveLength(1)
  expect(
    rows.filter((row) => row?.includes('Future Voice Plugin')),
  ).toHaveLength(1)
  expect(rows.find((row) => row?.includes('Speech recognition'))).toContain(
    'Future Recognition Plugin',
  )
  expect(rows.find((row) => row?.includes('Translation ·'))).toContain(
    'Future Translation Plugin',
  )
  expect(rows.find((row) => row?.includes('Speech ·'))).toContain(
    'Future Voice Plugin',
  )
  expect(document.body.textContent).not.toContain(futureEngineId)
  expect(document.body.textContent).not.toMatch(/unregistered-plugin|private/)
  const clear = [...document.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Clear errors'),
  )
  expect(clear).toBeDefined()
  clear!.click()
  await flushPromises()
  expect(bridgeWindow.ElectronSessionErrors.clear).toHaveBeenCalledOnce()
  expect(document.body.textContent).toContain('No errors in this session.')
  expect(wrapper.find('[aria-label="Error history"]').exists()).toBe(true)
})
it('shows the session error-history action in the reload toolbar independently of developer mode', async () => {
  bridgeWindow.ElectronMessengerWindow = { openDevTools: vi.fn() } as any
  const wrapper = render(
    compile('teams/messenger/components/NvMessengerHandleBar.vue'),
  )
  expect(wrapper.find('[aria-label="Error history"]').exists()).toBe(false)
  errors.hasOccurred = true
  await Vue.nextTick()
  expect(wrapper.find('[aria-label="Error history"]').exists()).toBe(true)
  settings.debugMode = true
  await Vue.nextTick()
  expect(wrapper.find('[aria-label="Error history"]').exists()).toBe(true)
})
