// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'

execFileSync(
  process.execPath,
  [resolve(dirname(fileURLToPath(import.meta.url)), 'build-client.mjs')],
  { stdio: 'pipe' },
)
const clientPath = '../../../coverage/ui-client/test-client.js'
const ui = await import(/* @vite-ignore */ clientPath)
const wrappers: VueWrapper[] = []

function nodes(
  root: ts.Node,
  predicate: (node: ts.Node) => boolean,
): ts.Node[] {
  const matches: ts.Node[] = []
  function visit(node: ts.Node) {
    if (predicate(node)) matches.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return matches
}
function one<T>(matches: T[]): T {
  expect(
    matches,
    'source extraction must identify exactly one target',
  ).toHaveLength(1)
  return matches[0]
}
function source(file: string) {
  return ts.createSourceFile(
    file,
    readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../../tests/app',
        file,
      ),
      'utf8',
    ),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  )
}
const journeys = source('journeys.cjs')
const runtime = source('runtime.cjs')
function evaluateCallback(
  root: ts.Node,
  predicate: (callback: ts.Node) => boolean,
) {
  const call = one(
    nodes(
      root,
      (node) =>
        ts.isCallExpression(node) &&
        node.expression.getText() === 'evaluate' &&
        !!node.arguments[1] &&
        ts.isArrowFunction(node.arguments[1]) &&
        predicate(node.arguments[1]),
    ),
  ) as ts.CallExpression
  // Execute only the real serialized renderer callback, not the Electron/store/audio harness.
  return new Function(`return (${call.arguments[1].getText()})`)() as (
    ...args: any[]
  ) => any
}
function activatesOption(callback: ts.Node, selector: string) {
  const queries = nodes(
    callback,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'querySelector' &&
      !!node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text === selector,
  )
  const activations = nodes(
    callback,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      (node.expression.name.text === 'click' ||
        (node.expression.name.text === 'dispatchEvent' &&
          nodes(
            node,
            (event) =>
              ts.isStringLiteral(event) &&
              ['mousedown', 'click'].includes(event.text),
          ).length > 0)),
  )
  return queries.length > 0 && activations.length > 0
}
const voiceJourney = one(
  nodes(
    journeys,
    (node) =>
      ts.isCallExpression(node) &&
      node.expression.getText() === 'run' &&
      node.arguments[0]?.getText() === '18',
  ),
) as ts.CallExpression
const journeySelector = one(
  nodes(
    voiceJourney,
    (node) =>
      ts.isVariableDeclaration(node) && node.name.getText() === 'selector',
  ),
) as ts.VariableDeclaration
const runtimeSelector = one(
  nodes(
    runtime,
    (node) =>
      ts.isStringLiteral(node) && node.text.includes('engine-voice-select'),
  ),
) as ts.StringLiteral
const openers = [
  {
    name: 'preset voice journey',
    selector: (journeySelector.initializer as ts.StringLiteral).text,
    open: evaluateCallback(voiceJourney, (callback) =>
      callback.getText().includes('document.querySelector(selector).click()'),
    ),
  },
  {
    name: 'live Nanami journey',
    selector: runtimeSelector.text,
    open: evaluateCallback(
      runtime,
      (callback) =>
        callback.getText().includes('engine-voice-select') &&
        callback.getText().includes('input.focus()'),
    ),
  },
]
async function settle() {
  await nextTick()
  await new Promise((done) => setTimeout(done, 40))
  await flushPromises()
}
function renderSelect(props: Record<string, any> = {}) {
  const wrapper = mount(ui.NvSelect, {
    attachTo: document.body,
    props: { options: [{ label: 'Nanami', value: 'nanami' }], ...props },
    attrs: { 'data-v-step': 'engine-voice-select' },
    global: {
      provide: {
        theme: ui.themes.get('izabela-dark'),
        [ui.PORTAL_TARGET]: document.body,
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
beforeEach(() => {
  // jsdom has no layout; focus-trap needs a visible reference, not native hit testing.
  const rect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 300,
    bottom: 40,
    width: 300,
    height: 40,
    toJSON() {
      return {}
    },
  }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    rect,
  ] as any)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: (entries: any[]) => void) {}
      observe(target: Element) {
        this.callback([
          {
            target,
            contentRect: rect,
            borderBoxSize: [{ inlineSize: 300, blockSize: 100 }],
          },
        ])
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
  if (!Element.prototype.scrollTo)
    Object.defineProperty(Element.prototype, 'scrollTo', {
      configurable: true,
      value() {},
    })
})
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('packaged app Select renderer callbacks', () => {
  it('updates the French language model through the real recovery callback', async () => {
    const selected = ref('en')
    const wrapper = renderSelect({
      options: [
        { label: 'English', value: 'en' },
        { label: 'Stale French', value: 'stale-fr' },
        { label: 'Fixture French', value: 'fr' },
      ],
      modelValue: selected.value,
      'onUpdate:modelValue': (value: string) => {
        selected.value = value
      },
    })
    await settle()
    ;(wrapper.get('input').element as HTMLInputElement).focus()
    await settle()
    const option = document.querySelector(
      '[title="Fixture French"]',
    ) as HTMLElement
    expect(option).not.toBeNull()
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
      option.dispatchEvent(
        new MouseEvent(type, { bubbles: true, cancelable: true }),
      )
      await settle()
      expect(selected.value, `no premature selection on ${type}`).toBe('en')
      expect(document.querySelector('.autocomplete')).not.toBeNull()
    }
    const chooseFrench = evaluateCallback(
      source('recovery-journeys.cjs'),
      (callback) =>
        callback.getText().includes('Missing French catalog option'),
    )
    chooseFrench()
    await settle()
    expect(
      selected.value,
      'catalog callback must update the actual Select model',
    ).toBe('fr')
    expect(wrapper.emitted('update:modelValue')).toEqual([['fr']])
    expect(document.querySelector('.autocomplete')).toBeNull()
  })
  it.each([
    { label: 'Elf', root: voiceJourney, value: { name: 'Elf' } },
    {
      label: 'Custom',
      root: voiceJourney,
      value: { name: 'Custom', pitch: 140 },
    },
    {
      label: 'ja-JP Nanami - Female',
      root: runtime,
      value: { ShortName: 'ja-JP-NanamiNeural', Locale: 'ja-JP' },
    },
  ])(
    'selects $label through the actual voice callback',
    async ({ label, root, value }) => {
      const selected = ref<unknown>('default')
      const wrapper = renderSelect({
        options: [
          { label: 'Default', value: 'default' },
          { label, value },
        ],
        modelValue: selected.value,
        'onUpdate:modelValue': (value: unknown) => {
          selected.value = value
        },
      })
      await settle()
      ;(wrapper.get('input').element as HTMLInputElement).focus()
      await settle()
      expect(document.querySelector(`[title="${label}"]`)).not.toBeNull()
      const activate = evaluateCallback(root, (callback) =>
        activatesOption(callback, `[title="${label}"]`),
      )
      activate()
      await settle()
      expect(
        selected.value,
        'voice callback must update the actual Select model',
      ).toEqual(value)
      expect(wrapper.emitted('update:modelValue')).toEqual([[value]])
      expect(document.querySelector('.autocomplete')).toBeNull()
    },
  )

  it('retains the favorite-button mousedown contract without selecting the voice', async () => {
    const wrapper = renderSelect({ options: [{ label: 'Elf', value: 'Elf' }] })
    await settle()
    ;(wrapper.get('input').element as HTMLInputElement).focus()
    await settle()
    const option = document.querySelector('[title="Elf"]') as HTMLElement
    expect(option).not.toBeNull()
    // Controlled application button boundary; Select and option event routing remain real.
    const favorite = document.createElement('button')
    favorite.title = 'Add to favorites'
    option.append(favorite)
    const events: string[] = []
    for (const type of ['mousedown', 'click'])
      favorite.addEventListener(type, (event) => {
        event.stopPropagation()
        events.push(event.type)
      })
    const addFavorite = evaluateCallback(voiceJourney, (callback) =>
      activatesOption(
        callback,
        '[title="Elf"] button[title="Add to favorites"]',
      ),
    )
    addFavorite()
    await settle()
    expect(events).toEqual(['mousedown'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(document.querySelector('.autocomplete')).not.toBeNull()
  })

  for (const opener of openers) {
    it.each(['native input', 'legacy wrapper'])(
      `${opener.name} opens the %s attribute layout`,
      async (layout) => {
        const wrapper = renderSelect()
        await settle()
        const input = wrapper.get('input').element as HTMLInputElement
        if (layout === 'legacy wrapper') {
          // Controlled compatibility boundary: only the historical attribute location changes.
          input.removeAttribute('data-v-step')
          input.parentElement!.setAttribute(
            'data-v-step',
            'engine-voice-select',
          )
        }
        expect(
          document.querySelector(opener.selector),
          'journey resolves the actual native input',
        ).toBe(input)
        const clicked = vi.fn()
        input.addEventListener('click', clicked)
        opener.open(opener.selector)
        await settle()
        expect(document.querySelector('.autocomplete')).not.toBeNull()
        if (opener.name === 'live Nanami journey') {
          expect(document.activeElement).toBe(input)
          expect(input.value).toBe('Nanami')
        } else
          expect(clicked).toHaveBeenCalledExactlyOnceWith(
            expect.any(MouseEvent),
          )
      },
    )
  }
})
