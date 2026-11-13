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
  const database = defineStore('databases', () => ({ data: vue.ref({}) }))(
    pinia,
  )
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
      './NvOverlayProcessPicker.vue': layout,
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
        useDatabasesStore: () => database,
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
    database.$dispose()
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
    database,
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

test('downloaded deny rules appear as read-only rows without changing local rules', async (t) => {
  const localRule = '**/local-test.exe'
  const publishedRule = '**/published-test.exe'
  const { wrapper, store, database } = fixture(t, {
    enableExperimentalGameOverlay: true,
    denylist: [localRule],
  })
  database.data['game-overlay-denylist'] = [publishedRule]
  await vue.nextTick()

  const denylist = wrapper
    .findAllComponents(layout)
    .find((component) => component.text() === 'DenylistAdd path')
  assert.ok(denylist)
  assert.equal(denylist.get(`[modelvalue="${publishedRule}"]`).attributes('readonly'), '')
  assert.equal(denylist.get(`[modelvalue="${localRule}"]`).attributes('readonly'), undefined)
  assert.deepEqual(store.denylist, [localRule])
})

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

test('experimental opt-in preserves the administrator startup setting', async (t) => {
  const f = fixture(t, { enableGameOverlay: true })
  assert.equal(f.runAsAdmin(), true)
  await f.toggle(1)
  assert.equal(f.runAsAdmin(), true)
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

test('process picker searches, reloads and edits only matching program rules', async (t) => {
  const blender = { name: 'Blender', executable: 'Blender.exe' }
  const frog = { name: 'Frog Game', executable: 'Gun Frog.exe' }
  const notepad = { name: 'Notepad', executable: 'Notepad.exe' }
  const paint = { name: 'Paint', executable: 'Paint.exe' }
  let processes = [blender, frog, notepad]
  let loads = 0
  let fail = false
  let finishInitialLoad
  const initialLoad = new Promise((resolve) => {
    finishInitialLoad = resolve
  })
  const originalResources = window.ElectronResources
  window.ElectronResources = {
    async getRunningOverlayPrograms() {
      loads++
      if (loads === 1) await initialLoad
      if (fail) throw new Error('Process listing unavailable')
      return processes
    },
  }
  t.after(() => {
    window.ElectronResources = originalResources
  })

  const loadingDirective = loadTypescript(
    fileURLToPath(
      new URL('../../../../../../packages/ui/src/loading.ts', import.meta.url),
    ),
    {
      '@/styled-system/css': { cva: () => () => 'loading-test-class' },
      '@/utils/loading-spinner': {
        createLoadingSpinner: () =>
          document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      },
    },
    {
      document,
      getComputedStyle: (element) => window.getComputedStyle(element),
    },
  ).loadingDirective

  const picker = compile(
    new URL('./NvOverlayProcessPicker.vue', import.meta.url),
    {
      '@packages/ui': {
        loadingDirective,
        NvButton: {
          render() {
            return vue.h('button', this.$slots.default?.())
          },
        },
        NvGroup: layout,
        NvStack: layout,
        NvDialog: {
          props: ['open'],
          emits: ['update:open'],
          render() {
            return vue.h('div', [
              vue.h(
                'div',
                { onClick: () => this.$emit('update:open', true) },
                this.$slots.reference?.(),
              ),
              this.open
                ? vue.h('section', { role: 'dialog' }, [
                    this.$slots.title?.(),
                    this.$slots.footer?.(),
                  ])
                : null,
            ])
          },
        },
        NvInput: {
          props: ['modelValue', 'size'],
          emits: ['update:modelValue'],
          render() {
            return vue.h('input', {
              value: this.modelValue,
              onInput: (event) =>
                this.$emit('update:modelValue', event.target.value),
            })
          },
        },
        NvTableColumn: layout,
        NvTable: {
          props: ['data', 'emptyText'],
          render() {
            const action = this.$slots.default()[1].children.default
            return vue.h(
              'div',
              this.data.length
                ? this.data.map((row) =>
                    vue.h('div', [row.name, action({ row })]),
                  )
                : this.emptyText,
            )
          },
        },
      },
    },
  )

  const allowlist = vue.ref(['**/BLENDER.exe', 'D:/Games/Gun Frog.exe'])
  const denylist = vue.ref(['**/Notepad.exe'])
  const wrapper = mount({
    setup: () => () =>
      vue.h('div', [
        vue.h(picker, {
          listName: 'Allowlist',
          modelValue: allowlist.value,
          'onUpdate:modelValue': (value) => {
            allowlist.value = value
          },
        }),
        vue.h(picker, {
          listName: 'Denylist',
          modelValue: denylist.value,
          'onUpdate:modelValue': (value) => {
            denylist.value = value
          },
        }),
      ]),
  })
  t.after(() => wrapper.unmount())

  await wrapper
    .get('[aria-label="Browse processes for Allowlist"]')
    .trigger('click')
  const allow = wrapper.get('[role="dialog"]')
  assert.ok(
    allow.get('[role="status"][aria-label="Loading processes"] svg').exists(),
  )
  assert.doesNotMatch(allow.text(), /Loading processes/)
  finishInitialLoad()
  await flushPromises()
  assert.equal(allow.find('[aria-label="Loading processes"]').exists(), false)
  await allow.get('input').setValue(' GUN FROG.EXE ')
  assert.equal(allow.find('[aria-label="Add Notepad"]').exists(), false)
  await allow.get('[aria-label="Add Frog Game"]').trigger('click')
  assert.deepEqual(
    [...allowlist.value],
    ['**/Gun Frog.exe', '**/BLENDER.exe', 'D:/Games/Gun Frog.exe'],
  )
  await allow.get('[aria-label="Remove Frog Game"]').trigger('click')
  assert.deepEqual(
    [...allowlist.value],
    ['**/BLENDER.exe', 'D:/Games/Gun Frog.exe'],
  )
  await allow.get('input').setValue('blender')
  await allow.get('[aria-label="Remove Blender"]').trigger('click')
  assert.deepEqual([...allowlist.value], ['D:/Games/Gun Frog.exe'])

  await allow.get('input').setValue('paint')
  assert.match(allow.text(), /No matching processes/)
  const clear = allow
    .findAll('button')
    .find((button) => button.text() === 'Clear')
  await clear.trigger('click')
  assert.equal(allow.get('input').element.value, '')
  assert.ok(allow.find('[aria-label="Add Frog Game"]').exists())
  await allow.get('input').setValue('paint')
  processes = [paint]
  const reload = allow
    .findAll('button')
    .find((button) => button.text() === 'Reload')
  await reload.trigger('click')
  await flushPromises()
  assert.ok(allow.find('[aria-label="Add Paint"]').exists())
  fail = true
  await reload.trigger('click')
  await flushPromises()
  assert.match(allow.text(), /Could not load running processes/)

  fail = false
  processes = [notepad, paint]
  await wrapper
    .get('[aria-label="Browse processes for Denylist"]')
    .trigger('click')
  await flushPromises()
  const deny = wrapper.findAll('[role="dialog"]')[1]
  await deny.get('[aria-label="Remove Notepad"]').trigger('click')
  await deny.get('[aria-label="Add Paint"]').trigger('click')
  assert.deepEqual([...denylist.value], ['**/Paint.exe'])
  assert.deepEqual([...allowlist.value], ['D:/Games/Gun Frog.exe'])
  assert.equal(loads, 4)
})
