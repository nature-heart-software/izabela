import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as vue from 'vue'
import { renderToString } from 'vue/server-renderer'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'

const filename = fileURLToPath(new URL('./DisplaySelect.vue', import.meta.url))
const primary = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
}
const secondary = {
  id: 22,
  bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
}

async function renderDisplay(settings, displays = [primary, secondary]) {
  let selected
  let update
  const patches = []
  const store = { ...settings, $patch: (value) => patches.push(value) }
  const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
  const script = compileScript(descriptor, {
    id: filename,
    inlineTemplate: true,
  })
  const component = loadTypescript(
    filename,
    {
      vue,
      '@packages/ui': {
        NvSelect: {
          props: ['modelValue', 'options'],
          setup(props, { attrs }) {
            selected = props
            update = attrs['onUpdate:modelValue']
            return () => vue.h('select')
          },
        },
      },
      '@/features/settings/store': { useSettingsStore: () => store },
      '@/features/display/utils': loadTypescript(
        fileURLToPath(new URL('../../utils.ts', import.meta.url)),
      ),
      '@/features/display/components/hooks': {
        useGetAllDisplaysQuery: () => ({
          data: vue.ref(displays),
          isFetching: vue.ref(false),
        }),
        useGetPrimaryDisplayQuery: () => ({
          data: vue.ref(displays[0]),
          isFetching: vue.ref(false),
        }),
      },
    },
    {},
    script.content,
  ).default
  const app = vue.createSSRApp(component)
  app.directive('loading', { getSSRProps: () => ({}) })
  await renderToString(app)
  return { selected, update, patches }
}

test('the dropdown resolves saved bounds to the current monitor ID after restart', async () => {
  const settings = JSON.parse(
    JSON.stringify({ display: 2, displayBounds: secondary.bounds }),
  )
  const { selected, patches } = await renderDisplay(settings)
  assert.equal(selected.modelValue, secondary.id)
  assert.ok(
    selected.options.some((option) => option.value === selected.modelValue),
  )
  assert.deepEqual(patches, [])
})

test('the dropdown prefers saved bounds when an old ID is reused', async () => {
  const reused = { ...primary, id: 2 }
  const { selected } = await renderDisplay(
    { display: reused.id, displayBounds: secondary.bounds },
    [reused, secondary],
  )
  assert.equal(selected.modelValue, secondary.id)
})

test('the dropdown retains ID-only settings and primary-monitor fallback', async () => {
  for (const [settings, expected] of [
    [{ display: secondary.id }, secondary.id],
    [{ display: 999, displayBounds: null }, primary.id],
    [{ display: null, displayBounds: null }, primary.id],
  ]) {
    const { selected, patches } = await renderDisplay(settings)
    assert.equal(selected.modelValue, expected)
    assert.deepEqual(patches, [])
  }
})

test('selecting a monitor still stores its ID and exact bounds', async () => {
  const { update, patches } = await renderDisplay({ display: primary.id })
  update(secondary.id)
  assert.equal(patches.length, 1)
  assert.equal(patches[0].display, secondary.id)
  assert.deepEqual(
    JSON.parse(JSON.stringify(patches[0].displayBounds)),
    secondary.bounds,
  )
})

test('an unavailable display inventory does not overwrite the saved preference', async () => {
  const { selected, patches } = await renderDisplay(
    { display: 2, displayBounds: secondary.bounds },
    [],
  )
  assert.equal(selected.modelValue, undefined)
  assert.deepEqual(patches, [])
})
