// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { Fragment, h, nextTick } from 'vue'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const testRoot = dirname(fileURLToPath(import.meta.url))
const components = {
  NvTable: 'display/Table/NvTable',
  NvTableColumn: 'display/Table/NvTableColumn',
  NvCard: 'display/Card/NvCard',
  NvCenter: 'miscellaneous/Center/NvCenter',
  NvDivider: 'miscellaneous/Divider/NvDivider',
  NvGroup: 'miscellaneous/Group/NvGroup',
  NvStack: 'miscellaneous/Stack/NvStack',
  NvVirtualList: 'miscellaneous/VirtualList/NvVirtualList',
  NvVirtualListContainer: 'miscellaneous/VirtualList/NvVirtualListContainer',
  NvText: 'typography/Text/NvText',
  NvIcon: 'typography/Icon/NvIcon',
  NvAlert: 'feedback/Alert/NvAlert',
  NvAccessBlocker: 'feedback/AccessBlocker/NvAccessBlocker',
}
const entry = [
  ...Object.entries(components).map(
    ([name, path]) =>
      `export { default as ${name} } from '@/components/${path}.vue'`,
  ),
  "export { themes } from '@/themes'",
].join('\n')
// Compile the actual SFC graph in Node; jsdom's typed arrays cannot host esbuild.
execFileSync(
  process.execPath,
  [
    '--input-type=module',
    '-e',
    `
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
await build({
  root: ${JSON.stringify(
    resolve(testRoot, '..'),
  )}, configFile: false, envFile: false, logLevel: 'error',
  plugins: [vue(), {
    name: 'display-client-entry',
    resolveId(id) { if (id === 'display-client' || id.endsWith('/display-client')) return 'display-client' },
    load(id) { if (id === 'display-client') return ${JSON.stringify(entry)} },
  }],
  resolve: { alias: ${JSON.stringify({
    '@': resolve(testRoot, '../src'),
    '@packages/design-tokens': resolve(
      testRoot,
      '../../design-tokens/src/main.ts',
    ),
    '@packages/icons': resolve(testRoot, '../../icons/src/main.ts'),
  })} },
  build: {
    outDir: ${JSON.stringify(
      resolve(testRoot, '../../../coverage/ui-display-client'),
    )}, emptyOutDir: false, minify: false,
    lib: { entry: 'display-client', formats: ['es'], fileName: () => 'display-client.js' },
    rollupOptions: { external: (id) => id === 'vue' || id.startsWith('vue/') },
  },
})
`,
  ],
  { stdio: 'pipe' },
)
const clientPath = '../../../coverage/ui-display-client/display-client.js'
const ui = await import(/* @vite-ignore */ clientPath)
const wrappers: VueWrapper[] = []
function render(component: any, options: any = {}) {
  const wrapper = mount(component, {
    attachTo: document.body,
    ...options,
    global: { provide: { theme: ui.themes.get('dark') } },
  })
  wrappers.push(wrapper)
  return wrapper
}
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
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
  vi.unstubAllGlobals()
})

describe('display migration', () => {
  it('uses colocated Panda styles without styled-components or Element Plus in display, layout, typography and feedback', () => {
    const forbidden: string[] = []
    for (const group of [
      'display',
      'miscellaneous',
      'typography',
      'feedback',
    ]) {
      const root = resolve(testRoot, `../src/components/${group}`)
      for (const entry of readdirSync(root, { recursive: true }).map(String)) {
        if (!/\.(ts|vue)$/.test(entry)) continue
        const source = readFileSync(`${root}/${entry}`, 'utf8')
        if (
          entry.endsWith('.styled.ts') ||
          /vue3-styled-components|element-plus|\.styled['"]/.test(source)
        )
          forbidden.push(`${group}/${entry}`)
      }
    }
    expect(forbidden).toEqual([])
  })

  it('keeps themed layout, polymorphic tags, attributes, slots and events on real display components', async () => {
    const clicked = vi.fn()
    const wrapper = render(ui.NvGroup, {
      props: { as: 'section', direction: 'column', grow: true, spacing: 2 },
      attrs: {
        'aria-label': 'Summary',
        class: 'consumer-group',
        onClick: clicked,
      },
      slots: {
        default: () =>
          h(ui.NvText, { as: 'strong', type: 'title' }, () => 'Details'),
      },
    })
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.attributes('aria-label')).toBe('Summary')
    expect(wrapper.classes()).toContain('consumer-group')
    expect(wrapper.classes()).toContain('gap_2')
    expect(wrapper.get('strong').text()).toBe('Details')
    expect(
      (wrapper.element as HTMLElement).style.getPropertyValue(
        '--nv-text-color',
      ),
    ).toBe(ui.themes.get('dark').text.color)
    await wrapper.trigger('click')
    expect(clicked).toHaveBeenCalledTimes(1)
    const blocker = render(ui.NvAccessBlocker, {
      props: { allowed: false, reason: 'Sign in' },
      slots: { default: 'Protected content' },
    })
    const center = blocker.findComponent({ name: 'NvCenter' })
    expect(center.classes()).toContain('w_100%')
    expect(center.classes()).toContain('h_100%')
    expect(blocker.text()).toContain('Sign in')
    await blocker.setProps({ allowed: true })
    await nextTick()
    expect(blocker.text()).toBe('Protected content')
  })

  it('keeps the real virtualized window, dynamic geometry, lifecycle and exposed scrolling while moving static layout to Panda', async () => {
    let offsetChanged: ((offset: number) => void) | undefined
    const rectCleanup = vi.fn()
    const offsetCleanup = vi.fn()
    const scrollTo = vi.fn()
    const onChange = vi.fn()
    const wrapper = render(ui.NvVirtualListContainer, {
      slots: {
        default: () =>
          h(
            ui.NvVirtualList,
            {
              count: 1000,
              options: {
                estimateSize: () => 32,
                overscan: 2,
                observeElementRect: (
                  _instance: unknown,
                  callback: Function,
                ) => {
                  callback({ width: 320, height: 64 })
                  return rectCleanup
                },
                observeElementOffset: (
                  _instance: unknown,
                  callback: (offset: number) => void,
                ) => {
                  offsetChanged = callback
                  callback(0)
                  return offsetCleanup
                },
                scrollToFn: scrollTo,
                onChange,
              },
            },
            {
              default: ({ index }: any) =>
                h('span', { 'data-index': index }, `Row ${index}`),
            },
          ),
      },
    })
    await nextTick()
    await new Promise((done) => setTimeout(done, 20))
    const list = wrapper.findComponent({ name: 'NvVirtualList' })
    expect(list.classes()).toContain('pos_relative')
    expect((list.element as HTMLElement).style.height).toBe('2000rem')
    expect(list.findAll('[data-index]').length).toBeLessThan(20)
    expect(list.find('[data-index="0"]').exists()).toBe(true)
    offsetChanged!(640)
    await nextTick()
    expect(list.find('[data-index="20"]').exists()).toBe(true)
    expect(list.find('[data-index="0"]').exists()).toBe(false)
    expect(
      list.get('[data-index="20"]').element.parentElement?.style.transform,
    ).toBe('translateY(640px)')
    expect(onChange).toHaveBeenCalled()
    expect(list.emitted('visible')).toEqual([[]])
    ;(list.vm as any).scrollToIndex(30, { align: 'start' })
    await new Promise((done) => setTimeout(done, 20))
    expect(scrollTo.mock.calls.at(-1)?.[0]).toBe(960)
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(list.emitted('hidden')).toEqual([[]])
    expect(rectCleanup).toHaveBeenCalled()
    expect(offsetCleanup).toHaveBeenCalled()
  })

  it('renders semantic table headers and scoped row cells, forwarding native table attributes', async () => {
    const rows = [
      { name: 'Ada', details: { address: 'London' } },
      { name: 'Grace', details: { address: 'New York' } },
    ]
    const wrapper = render(ui.NvTable, {
      props: { data: rows },
      attrs: {
        'aria-label': 'People',
        class: 'consumer-table',
        style: 'width: 100%',
      },
      slots: {
        default: () => [
          h(
            ui.NvTableColumn,
            { prop: 'name', label: 'Name', width: '180' },
            {
              header: ({ column, $index }: any) =>
                h('strong', `${column.label} ${$index}`),
              default: ({ row, $index, column }: any) =>
                h(
                  'button',
                  { onClick: () => row.name },
                  `${row.name} ${$index} ${column.property}`,
                ),
            },
          ),
          h(Fragment, null, [
            h(ui.NvTableColumn, {
              prop: 'details.address',
              label: 'Address',
              fixed: 'right',
            }),
          ]),
        ],
      },
    })
    const table = wrapper.get('table')
    expect(table.attributes('aria-label')).toBe('People')
    expect(table.classes()).toContain('consumer-table')
    expect(table.findAll('thead th').map((cell) => cell.text())).toEqual([
      'Name 0',
      'Address',
    ])
    expect(
      table
        .findAll('thead th')
        .every((cell) => cell.attributes('scope') === 'col'),
    ).toBe(true)
    expect(table.findAll('tbody tr').map((row) => row.text())).toEqual([
      'Ada 0 nameLondon',
      'Grace 1 nameNew York',
    ])
    expect(table.get('col').attributes('style')).toContain('180px')
    await wrapper.setProps({ data: [rows[1]] })
    expect(table.findAll('tbody tr')).toHaveLength(1)
    expect(table.get('button').text()).toBe('Grace 0 name')
  })
})
