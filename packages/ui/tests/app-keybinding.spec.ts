// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import * as Vue from 'vue'
import * as VueUse from '@vueuse/core'
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
const filename = resolve(
  here,
  '../../../apps/app/src/features/app/components/inputs/NvKeybinding.vue',
)
const compiled = compileScript(
  parse(readFileSync(filename, 'utf8'), { filename }).descriptor,
  { id: filename, inlineTemplate: true },
)
const code = ts.transpileModule(compiled.content, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText
const imports: Record<string, unknown> = {
  vue: Vue,
  '@vueuse/core': VueUse,
  '@packages/ui': ui,
  '@/styled-system/css': { css: () => '' },
}
const component = { exports: {} as { default: Vue.Component } }
new Function('require', 'exports', code)((id: string) => {
  if (!Object.hasOwn(imports, id)) throw Error('Unexpected import ' + id)
  return imports[id]
}, component.exports)
const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
})

function render() {
  const wrapper = mount(component.exports.default, {
    attachTo: document.body,
    props: { modelValue: [{ code: 'KeyA', key: 'a' }] },
  })
  wrappers.push(wrapper)
  const button = wrapper.get('button').element as HTMLButtonElement
  button.focus()
  return { wrapper, button }
}

async function key(
  target: Element,
  type: string,
  key: string,
  code: string,
  repeat = false,
) {
  const event = new KeyboardEvent(type, {
    key,
    code,
    repeat,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  await Vue.nextTick()
  return event
}

it('keeps the same focused button after Escape cancels listening', async () => {
  const { wrapper, button } = render()
  const parentKey = vi.fn()
  wrapper.element.parentElement!.addEventListener('keydown', parentKey)
  try {
    button.click()
    await Vue.nextTick()
    expect(document.activeElement).toBe(button)
    expect(wrapper.text()).toBe('Listening...')
    await key(button, 'keydown', 'Escape', 'Escape')
    await key(button, 'keyup', 'Escape', 'Escape')
    expect(wrapper.text()).toBe('a')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('button').element).toBe(button)
    expect(document.activeElement).toBe(button)
    expect(parentKey).not.toHaveBeenCalled()
  } finally {
    wrapper.element.parentElement!.removeEventListener('keydown', parentKey)
  }
})

it('ignores the Enter activation release and captures a subsequent Enter', async () => {
  const { wrapper, button } = render()
  await key(button, 'keydown', 'Enter', 'Enter')
  // jsdom does not synthesize the native click from Enter.
  button.click()
  await Vue.nextTick()
  await key(button, 'keydown', 'Enter', 'Enter', true)
  await key(button, 'keyup', 'Enter', 'Enter')
  expect(wrapper.text()).toBe('Listening...')
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()

  expect(
    (await key(button, 'keydown', 'Enter', 'Enter')).defaultPrevented,
  ).toBe(true)
  await key(button, 'keyup', 'Enter', 'Enter')
  expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([
    expect.objectContaining({ code: 'Enter' }),
  ])
  expect(wrapper.text()).toBe('a')
  expect(document.activeElement).toBe(button)
})

it('keeps focus after capturing a chord and suppresses Space button activation', async () => {
  const { wrapper, button } = render()
  button.click()
  await Vue.nextTick()
  await key(button, 'keydown', 'Control', 'ControlLeft')
  const space = await key(button, 'keydown', ' ', 'Space')
  const release = await key(button, 'keyup', ' ', 'Space')
  expect(space.defaultPrevented).toBe(true)
  expect(release.defaultPrevented).toBe(true)
  expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([
    expect.objectContaining({ code: 'ControlLeft' }),
    expect.objectContaining({ code: 'Space' }),
  ])
  expect(wrapper.get('button').element).toBe(button)
  expect(document.activeElement).toBe(button)
  expect(wrapper.text()).toBe('a')
})
