import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { compileScript, parse } from '@vue/compiler-sfc'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
for (const name of [
  'window',
  'document',
  'Element',
  'HTMLElement',
  'SVGElement',
  'Node',
  'Document',
  'HTMLInputElement',
  'HTMLLabelElement',
  'ShadowRoot',
  'MutationObserver',
]) {
  globalThis[name] = dom.window[name]
}
const vue = await import('vue')
const piniaModule = await import('pinia')
const { createPinia, defineStore } = piniaModule
const { mount, flushPromises } = await import('@vue/test-utils')

function compile(url, imports) {
  const filename = fileURLToPath(url)
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
    { vue, '@/styled-system/css': { css: () => '' }, ...imports },
    { window },
    script.content,
  ).default
}

const layout = {
  setup:
    (_, { slots }) =>
    () =>
      vue.h('div', slots.default?.()),
}
// Keep the real switch's click/emission behavior; only its styling is replaced.
const NvSwitch = compile(
  new URL(
    '../../../../../../packages/ui/src/components/forms/Switch/NvSwitch.vue',
    import.meta.url,
  ),
  {
    './switch.panda': {
      switchRecipe: () => ({}),
      StSwitch: {
        render() {
          return vue.h('span', this.$slots.default?.())
        },
      },
    },
  },
)
const { useGameOverlayStore } = loadTypescript(
  fileURLToPath(
    new URL('../../../features/game-overlay/store/index.ts', import.meta.url),
  ),
)
const { useMessengerStateStore } = loadTypescript(
  fileURLToPath(new URL('../store/index.ts', import.meta.url)),
)

function fixture(t, saved = {}, decision = 'confirm') {
  const pinia = createPinia()
  const store = useGameOverlayStore(pinia)
  store.$patch(saved)
  const messenger = useMessengerStateStore(pinia)
  const calls = { admin: 0, confirmation: 0, closed: 0 }
  let runAsAdmin = true
  const defenderCalls = []
  const defenderPreviews = []
  let defenderAction = async () => ({ status: 'cancelled' })
  const originalResources = window.ElectronResources
  window.ElectronResources = {
    prepareOverlayInjectorDefenderExclusions: async () => {
      defenderPreviews.push(true)
      return {
        status: 'ready',
        token: 'main-plan',
      }
    },
    addOverlayInjectorDefenderExclusions: (token) => {
      defenderCalls.push(token)
      return defenderAction()
    },
  }
  const component = compile(
    new URL('./NvSettingsGameOverlay.vue', import.meta.url),
    {
      pinia: piniaModule,
      '@packages/ui': {
        ...Object.fromEntries(
          [
            'NvButton',
            'NvCard',
            'NvDivider',
            'NvGroup',
            'NvInput',
            'NvStack',
            'NvText',
          ].map((name) => [name, layout]),
        ),
        NvSwitch,
        NvDialog: {
          props: ['open'],
          setup:
            (props, { slots }) =>
            () =>
              props.open
                ? vue.h('section', { role: 'dialog' }, [
                    slots.title?.(),
                    slots.description?.(),
                    slots.footer?.(),
                  ])
                : null,
        },
      },
      '@/features/game-overlay/store': { useGameOverlayStore: () => store },
      '@/features/databases/store': {
        useDatabasesStore: () =>
          defineStore('databases', () => ({ data: vue.ref({}) }))(pinia),
      },
      '@/store/use-confirm-store.ts': {},
      '@/features/settings/store': {
        useSettingsStore: () => ({
          enableRunAsAdmin: () => {
            calls.admin++
            runAsAdmin = true
          },
          disableRunAsAdmin: () => {
            runAsAdmin = false
          },
        }),
      },
      '@/hooks/use-confirm-admin.ts': {
        useConfirmAdmin: () => async () => {
          calls.confirmation++
          return { type: decision, close: () => calls.closed++ }
        },
      },
      '@/teams/messenger/store': { useMessengerStateStore: () => messenger },
    },
  )
  const wrapper = mount(component)
  t.after(() => {
    window.ElectronResources = originalResources
    wrapper.unmount()
    store.$dispose()
    messenger.$dispose()
  })
  async function toggle(index, value) {
    const control = wrapper.findAllComponents(NvSwitch)[index]
    assert.ok(control, `Missing overlay switch ${index}`)
    if (value === undefined) control.get('input[role="switch"]').element.click()
    else control.vm.$emit('update:modelValue', value)
    await Promise.resolve()
    await vue.nextTick()
  }
  return {
    wrapper,
    store,
    messenger,
    calls,
    toggle,
    runAsAdmin: () => runAsAdmin,
    defenderCalls,
    defenderPreviews,
    setDefenderAction: (action) => {
      defenderAction = action
    },
  }
}

test('experimental opt-in deselects legacy, marks restart and never requests elevation', async (t) => {
  const { wrapper, store, messenger, calls, toggle } = fixture(t, {
    enableGameOverlay: true,
  })
  assert.equal(messenger.markForRestart, false)
  await toggle(1)
  assert.equal(store.enableExperimentalGameOverlay, true)
  assert.equal(store.enableGameOverlay, false)
  assert.equal(messenger.markForRestart, true)
  assert.deepEqual(calls, { admin: 0, confirmation: 0, closed: 0 })
  assert.match(wrapper.text(), /Enable Experimental Game Overlay/)
})

test('experimental opt-in disables the legacy administrator startup setting', async (t) => {
  const f = fixture(t, { enableGameOverlay: true })
  assert.equal(f.runAsAdmin(), true)
  await f.toggle(1)
  assert.equal(f.runAsAdmin(), false)
})

test('confirmed legacy opt-in deselects experimental and retains the admin requirement', async (t) => {
  const { store, messenger, calls, toggle } = fixture(t, {
    enableExperimentalGameOverlay: true,
  })
  await toggle(0)
  assert.equal(store.enableGameOverlay, true)
  assert.equal(store.enableExperimentalGameOverlay, false)
  assert.equal(messenger.markForRestart, true)
  assert.deepEqual(calls, { admin: 1, confirmation: 1, closed: 1 })
})

for (const [index, flag] of [
  'enableGameOverlay',
  'enableExperimentalGameOverlay',
].entries()) {
  test(`disabling ${flag} marks restart without elevation`, async (t) => {
    const { store, messenger, calls, toggle } = fixture(t, { [flag]: true })
    await toggle(index)
    assert.equal(store.enableGameOverlay, false)
    assert.equal(store.enableExperimentalGameOverlay, false)
    assert.equal(messenger.markForRestart, true)
    assert.deepEqual(calls, { admin: 0, confirmation: 0, closed: 0 })
  })
}

test('the shared allowlist and denylist are visible for either opt-in only', async (t) => {
  const { wrapper, store, toggle } = fixture(t, {
    allowlist: ['game.exe'],
    denylist: ['blocked.exe'],
  })
  assert.doesNotMatch(wrapper.text(), /Allowlist|Denylist/)
  await toggle(1)
  assert.match(wrapper.text(), /Allowlist/)
  assert.match(wrapper.text(), /Denylist/)
  await toggle(0)
  assert.match(wrapper.text(), /Allowlist/)
  assert.match(wrapper.text(), /Denylist/)
  assert.deepEqual([...store.allowlist], ['game.exe'])
  assert.deepEqual([...store.denylist], ['blocked.exe'])
  await toggle(0)
  assert.doesNotMatch(wrapper.text(), /Allowlist|Denylist/)
})

test('both choices have distinct labels', (t) => {
  const { wrapper } = fixture(t)
  const text = wrapper.text().replace(/\s+/g, ' ')
  assert.match(text, /Enable Game Overlay/)
  assert.match(text, /Enable Experimental Game Overlay/)
})

test('both switches expose their names and state and support keyboard opt-in', async (t) => {
  const { wrapper, store } = fixture(t)
  const legacy = wrapper.get(
    '[role="switch"][aria-label="Enable Game Overlay"]',
  )
  const experimental = wrapper.get(
    '[role="switch"][aria-label="Enable Experimental Game Overlay"]',
  )
  assert.equal(legacy.attributes('aria-checked'), 'false')
  assert.equal(experimental.attributes('aria-checked'), 'false')
  await experimental.trigger('keydown', { key: ' ' })
  assert.equal(store.enableExperimentalGameOverlay, true)
  assert.equal(experimental.attributes('aria-checked'), 'true')
  await legacy.trigger('keydown', { key: 'Enter' })
  await vue.nextTick()
  assert.equal(store.enableGameOverlay, true)
  assert.equal(store.enableExperimentalGameOverlay, false)
  assert.equal(legacy.attributes('aria-checked'), 'true')
  assert.equal(experimental.attributes('aria-checked'), 'false')
})

test('cancelled legacy confirmation preserves experimental opt-in without a restart or elevation', async (t) => {
  const { store, messenger, calls, toggle } = fixture(
    t,
    { enableExperimentalGameOverlay: true },
    'cancel',
  )
  await toggle(0)
  assert.equal(store.enableGameOverlay, false)
  assert.equal(store.enableExperimentalGameOverlay, true)
  assert.equal(messenger.markForRestart, false)
  assert.deepEqual(calls, { admin: 0, confirmation: 1, closed: 1 })
})

test('Defender action appears only for experimental opt-in and never runs on mount', async (t) => {
  const f = fixture(t)
  assert.equal(
    f.wrapper.find('[data-overlay-defender-exclusions]').exists(),
    false,
  )
  await f.toggle(1)
  assert.equal(
    f.wrapper.find('[data-overlay-defender-exclusions]').exists(),
    true,
  )
  assert.equal(f.defenderCalls.length, 0)
})

test('Defender explanation uses the in-app dialog; cancellation never requests exclusions', async (t) => {
  const f = fixture(t, { enableExperimentalGameOverlay: true })
  await f.wrapper.get('[data-overlay-defender-exclusions]').trigger('click')
  await flushPromises()
  assert.equal(f.defenderPreviews.length, 1)
  assert.equal(f.defenderCalls.length, 0)
  const dialog = f.wrapper.get('[role="dialog"]')
  assert.match(
    dialog.get('[data-overlay-defender-dialog]').text(),
    /may be flagged as malware by Microsoft Defender/,
  )
  assert.match(
    dialog.get('[data-overlay-defender-dialog]').text(),
    /exclusion list/,
  )
  assert.doesNotMatch(dialog.text(), /C:\\SDK|runtime\/inject/)
  assert.equal(dialog.findAll('[data-overlay-defender-path]').length, 0)
  await dialog.get('[data-overlay-defender-cancel]').trigger('click')
  await flushPromises()
  assert.equal(f.wrapper.find('[role="dialog"]').exists(), false)
  assert.equal(f.defenderCalls.length, 0)
  assert.equal(f.calls.admin, 0)
})

test('only the in-app confirmation runs the single-flight action and reports success', async (t) => {
  const f = fixture(t, { enableExperimentalGameOverlay: true })
  let finish
  f.setDefenderAction(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const button = f.wrapper.get('[data-overlay-defender-exclusions]')
  await button.trigger('click')
  await flushPromises()
  await f.wrapper.get('[data-overlay-defender-confirm]').trigger('click')
  await button.trigger('click')
  assert.deepEqual(f.defenderCalls, ['main-plan'])
  assert.equal(button.attributes('disabled'), 'true')
  finish({ status: 'added', message: 'Injector exclusions configured.' })
  await flushPromises()
  assert.match(f.wrapper.get('[role="status"]').text(), /configured/)
  assert.equal(f.calls.admin, 0)
})

test('Defender invocation errors remain visible without leaking native details', async (t) => {
  const f = fixture(t, { enableExperimentalGameOverlay: true })
  f.setDefenderAction(() => Promise.reject(new Error('secret native error')))
  await f.wrapper.get('[data-overlay-defender-exclusions]').trigger('click')
  await flushPromises()
  await f.wrapper.get('[data-overlay-defender-confirm]').trigger('click')
  await flushPromises()
  assert.match(
    f.wrapper.get('[role="status"]').text(),
    /could not be configured/,
  )
  assert.doesNotMatch(f.wrapper.text(), /secret native error/)
})
