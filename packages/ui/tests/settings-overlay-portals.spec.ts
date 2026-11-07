// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import * as Router from 'vue-router'
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
const empty = { render: () => null }
const imports: Record<string, unknown> = {
  vue: Vue,
  'vue-router': Router,
  '@packages/ui': ui,
  '@/styled-system/css': {
    css: (styles: Record<string, string>) =>
      styles.overflowY === 'auto' ? 'route-scroll-area' : '',
  },
  '@/teams/messenger/components/NvStoreDialog.vue': empty,
  '@/store/use-confirm-store.ts': {
    useConfirmStore: () => ({ instances: [] }),
  },
  '@/teams/messenger/store': {
    useMessengerStateStore: () => ({ markForRestart: false }),
  },
  '@/features/settings/store': { useSettingsStore: () => ({ theme: 'dark' }) },
  '@/teams/messenger/components/NvMarkForRestartMessage.vue': empty,
  '@/consts.ts': { isGameOverlay: false },
  '@/features/app/queries.ts': { useGetAppInfoQuery() {} },
}
function compile(relative: string) {
  const filename = resolve(here, '../../../apps/app/src', relative)
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
    (id: string) => {
      if (Object.hasOwn(imports, id)) return imports[id]
      throw Error(`Unexpected settings import: ${id}`)
    },
    module,
    module.exports,
  )
  return module.exports.default
}
imports['@/teams/messenger/components/NvPortalTarget.vue'] = compile(
  'teams/messenger/components/NvPortalTarget.vue',
)
const Settings = compile('teams/messenger/views/NvSettings.vue')
const wrappers: VueWrapper[] = []
async function settle() {
  await Vue.nextTick()
  await new Promise((resolve) => setTimeout(resolve, 40))
  await flushPromises()
}
beforeEach(() => {
  const rect = new DOMRect(0, 0, 300, 100)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    rect,
  ] as any)
  for (const [key, value] of [
    ['offsetWidth', 300],
    ['offsetHeight', 100],
  ] as const)
    vi.spyOn(HTMLElement.prototype, key, 'get').mockReturnValue(value)
  for (const key of ['ResizeObserver', 'IntersectionObserver'])
    vi.stubGlobal(
      key,
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

it.each(['select', 'popover'])(
  'renders the Settings %s surface inside its actual route scroll area within an outer popup',
  async (kind) => {
    const Page = {
      render: () =>
        kind === 'select'
          ? Vue.h(ui.NvSelect, {
              id: 'settings-choice',
              options: [{ label: 'Alpha', value: 'a' }],
            })
          : Vue.h(
              ui.NvPopover,
              {},
              {
                reference: () =>
                  Vue.h('button', { id: 'settings-more' }, 'More'),
                default: () =>
                  Vue.h('div', { id: 'settings-popup' }, 'Content'),
              },
            ),
    }
    const router = Router.createRouter({
      history: Router.createMemoryHistory(),
      routes: [
        {
          path: '/settings',
          component: Settings,
          children: [{ path: 'general', component: Page }],
        },
      ],
    })
    await router.push('/settings/general')
    const wrapper = mount(ui.NvPopover, {
      attachTo: document.body,
      slots: {
        reference: () => Vue.h('button', { id: 'open-settings' }, 'Settings'),
        default: () => Vue.h(Router.RouterView),
      },
      global: {
        plugins: [router],
        stubs: {
          RouterLink: {
            setup(_, { slots }) {
              return () => slots.default?.({ href: '#', navigate: () => {} })
            },
          },
        },
        provide: {
          theme: ui.themes.get('dark'),
          [ui.PORTAL_TARGET]: document.body,
        },
      },
    })
    wrappers.push(wrapper)
    ;(document.getElementById('open-settings') as HTMLElement).click()
    await settle()
    const pane = document.querySelector('.route-scroll-area')!
    const trigger = document.getElementById(
      kind === 'select' ? 'settings-choice' : 'settings-more',
    )!
    trigger.focus()
    trigger.click()
    await settle()
    const surface = document.querySelector(
      kind === 'select' ? '.autocomplete' : '#settings-popup',
    )!
    const positioner = surface.closest('[data-part="positioner"]')!
    expect(pane.contains(positioner)).toBe(true)
    expect(positioner.parentElement).toBe(pane)
    expect((positioner as HTMLElement).style.visibility).toBe('')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  },
)
