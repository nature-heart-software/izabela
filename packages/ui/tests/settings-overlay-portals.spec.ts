// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import * as Router from 'vue-router'
import * as Ark from '@ark-ui/vue'
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
  '@ark-ui/vue': Ark,
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
imports['@/teams/messenger/components/NvPanelNavigation.vue'] = compile(
  'teams/messenger/components/NvPanelNavigation.vue',
)
const Settings = compile('teams/messenger/views/NvSettings.vue')
const Messages = compile('teams/messenger/views/NvMessages.vue')
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

async function panel(kind: 'settings' | 'messages', emptyContent = false) {
  const names =
    kind === 'settings'
      ? [
          'general',
          'game-overlay',
          'engine',
          'profiles',
          'audio-outputs',
          'audio-input',
          'translation',
          'dictionary',
          'commands',
          'about',
          'support',
        ]
      : ['history', 'shortcuts']
  const Page = {
    render: () =>
      emptyContent
        ? Vue.h('p', 'No messages')
        : Vue.h('div', [
            Vue.h('button', { disabled: true }, 'Disabled'),
            Vue.h('div', { inert: true }, [Vue.h('button', {}, 'Blocked')]),
            Vue.h('input', { 'data-content-first': '', value: 'Draft' }),
            Vue.h('button', { 'data-content-next': '' }, 'Next'),
          ]),
  }
  const router = Router.createRouter({
    history: Router.createMemoryHistory(),
    routes: [
      {
        path: `/${kind}`,
        name: kind,
        component: kind === 'settings' ? Settings : Messages,
        children: names.map((name) => ({
          path: name,
          name: `${kind}-${name}`,
          component: Page,
        })),
      },
    ],
  })
  // Start on the second entry: choosing tabs should focus the current page,
  // rather than always sending the user to the top of the sidebar.
  await router.push(`/${kind}/${names[1]}`)
  const wrapper = mount(
    { render: () => Vue.h(Router.RouterView) },
    {
      attachTo: document.body,
      global: {
        plugins: [router],
        provide: {
          theme: ui.themes.get('dark'),
          [ui.PORTAL_TARGET]: document.body,
        },
      },
    },
  )
  wrappers.push(wrapper)
  await settle()
  const close = document.querySelector<HTMLButtonElement>(
    '[data-messenger-panel-close]',
  )!
  const openChooser = async () => {
    close.focus()
    close.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      }),
    )
    await settle()
  }
  return { wrapper, router, close, openChooser }
}

it.each(['settings', 'messages'] as const)(
  '%s starts at Close and offers tabs/content on the next Tab',
  async (kind) => {
    const { wrapper, close, openChooser } = await panel(kind)
    expect(document.activeElement).toBe(close)
    expect(close.getAttribute('aria-label')).toBe('Close')
    await openChooser()
    expect(close.getAttribute('aria-expanded')).toBe('true')
    const chooser = document.querySelector<HTMLElement>('[role="dialog"]')!
    expect(chooser.textContent).toContain('Navigate to')
    const choices = chooser.querySelectorAll<HTMLButtonElement>('button')
    expect(choices).toHaveLength(2)
    expect([...choices].map((choice) => choice.textContent?.trim())).toEqual([
      'Navigation',
      'Page content',
    ])
    expect(document.activeElement).toBe(choices[0])
    choices[0].click()
    await settle()
    expect(document.activeElement).toBe(
      wrapper.get('[aria-current="page"]').element,
    )
    expect(close.getAttribute('aria-expanded')).toBe('false')
    expect(
      wrapper
        .findComponent(kind === 'settings' ? Settings : Messages)
        .emitted('close'),
    ).toBeUndefined()
    await openChooser()
    document
      .querySelectorAll<HTMLButtonElement>('[role="dialog"] button')[1]
      .click()
    await settle()
    expect(document.activeElement).toBe(
      wrapper.get('[data-content-first]').element,
    )
    expect(close.getAttribute('aria-expanded')).toBe('false')
    expect((document.activeElement as HTMLInputElement).value).toBe('Draft')
  },
)

it.each(['settings', 'messages'] as const)(
  '%s returns to Close on Escape, preserves reverse Tab, and still closes on click',
  async (kind) => {
    const { wrapper, close, openChooser } = await panel(kind)
    const reverseTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    close.dispatchEvent(reverseTab)
    await settle()
    expect(reverseTab.defaultPrevented).toBe(false)
    expect(close.getAttribute('aria-expanded')).toBe('false')
    await openChooser()
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
    await settle()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(close)
    const shell = wrapper.findComponent(
      kind === 'settings' ? Settings : Messages,
    )
    expect(shell.emitted('close')).toBeUndefined()
    close.click()
    await settle()
    expect(shell.emitted('close')).toHaveLength(1)
  },
)

it.each(['settings', 'messages'] as const)(
  '%s focuses the content region when it has no usable controls',
  async (kind) => {
    const { wrapper, openChooser } = await panel(kind, true)
    await openChooser()
    document
      .querySelectorAll<HTMLButtonElement>('[role="dialog"] button')[1]
      .click()
    await settle()
    expect(document.activeElement).toBe(
      wrapper.get('.settings__content').element,
    )
  },
)

it('keeps sidebar focus and content state when changing the Settings tab', async () => {
  const { wrapper, router, close, openChooser } = await panel('settings')
  await openChooser()
  document.querySelector<HTMLButtonElement>('[role="dialog"] button')!.click()
  await settle()
  const general = wrapper.get<HTMLAnchorElement>(
    'a[href="/settings/general"]',
  ).element
  general.focus()
  general.click()
  await settle()
  expect(router.currentRoute.value.name).toBe('settings-general')
  expect(document.activeElement).toBe(general)
  expect(document.activeElement).not.toBe(close)
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
    await vi.waitFor(() =>
      expect(
        document.activeElement?.closest(
          '[data-scope="popover"][data-part="content"]',
        ),
      ).not.toBeNull(),
    )
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
