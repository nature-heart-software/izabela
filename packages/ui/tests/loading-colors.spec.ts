// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
execFileSync(process.execPath, [resolve(root, 'tests/build-client.mjs')], {
  stdio: 'pipe',
})
const clientPath = '../../../coverage/ui-client/test-client.js'
const { NvButton, loadingDirective } = await import(
  /* @vite-ignore */ clientPath
)
const require = createRequire(import.meta.url)
const pandaRequire = createRequire(
  require.resolve('@pandacss/dev/package.json'),
)
const postcss = pandaRequire('postcss')
const selectorParser = pandaRequire('postcss-selector-parser')
const rules: {
  selector: string
  classes: string[]
  declarations: Record<string, string>
}[] = []
postcss
  .parse(readFileSync(resolve(root, 'src/styled-system/styles.css'), 'utf8'))
  .walkRules((rule: any) => {
    const declarations: Record<string, string> = {}
    rule.walkDecls((decl: any) => {
      declarations[decl.prop] = decl.value
    })
    selectorParser((selectors: any) =>
      selectors.each((selector: any) => {
        const classes: string[] = []
        selector.walkClasses((node: any) => classes.push(node.value))
        rules.push({
          selector: selector.toString().trim(),
          classes,
          declarations,
        })
      }),
    ).processSync(rule.selector)
  })
function render(type: string) {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        withDirectives(
          h(NvButton, { type }, () => 'Save'),
          [[loadingDirective, true]],
        ),
    }),
  )
  const owned = rules
    .filter((rule) =>
      rule.classes.some((name) => wrapper.classes().includes(name)),
    )
    .map((rule) => ({
      ...rule,
      selector: selectorParser((selectors: any) =>
        selectors.walkClasses((node: any) => {
          if (wrapper.classes().includes(node.value)) node.value = 'host'
        }),
      ).processSync(rule.selector),
    }))
  return { wrapper, owned }
}

describe('opaque button directive loading colors', () => {
  it.each(['default', 'active', 'plain'])(
    'tracks every %s background role in emitted CSS',
    (type) => {
      const { wrapper, owned } = render(type)
      try {
        for (const state of ['', '-hover', '-pressed', '-selected']) {
          const role = `var(--colors-button-${type}${state}-background)`
          const surface = owned.filter(
            (rule) => rule.declarations['background-color'] === role,
          )
          expect(surface.length).toBeGreaterThan(0)
          for (const rule of surface) {
            expect(
              owned.some(
                (candidate) =>
                  candidate.selector === rule.selector &&
                  candidate.declarations['--nv-button-loading-surface'] ===
                    role,
              ),
              `${type}${state} contextual RGB`,
            ).toBe(true)
          }
        }
        expect(wrapper.get('.nv-loading-mask').element.parentElement).toBe(
          wrapper.element,
        )
        expect((wrapper.element as HTMLButtonElement).disabled).toBe(false)
      } finally {
        wrapper.unmount()
      }
    },
  )

  it.each(['default', 'active', 'plain'])(
    'masks only the %s background layer with source alpha',
    (type) => {
      const { wrapper, owned } = render(type)
      try {
        const declarations = (suffix: string) =>
          Object.assign(
            {},
            ...owned
              .filter((rule) => rule.selector.endsWith(suffix))
              .map((rule) => rule.declarations),
          )
        const mask = declarations(' > .nv-loading-mask')
        const layer = declarations(' > .nv-loading-mask::before')
        const spinner = declarations(' > .nv-loading-mask > svg')
        expect(mask['background-color']).toBe('var(--colors-transparent)')
        expect(mask.opacity).toBeUndefined()
        expect(mask['mask-image']).toBeUndefined()
        expect(layer['background-color']).toBe(
          'var(--nv-button-loading-surface)',
        )
        expect(layer['mask-image']).toBe(
          'linear-gradient(var(--colors-loading-default-pending-background), var(--colors-loading-default-pending-background))',
        )
        expect(layer['mask-mode']).toBe('alpha')
        expect(layer.position).toBe('absolute')
        expect(layer.inset).toBe('var(--spacing-0)')
        expect(layer['border-radius']).toBe('inherit')
        expect(layer['pointer-events']).toBe('none')
        expect(spinner.position).toBe('relative')
        expect(spinner['z-index']).toBe('1')
        expect(spinner.opacity).toBeUndefined()
        expect(spinner['mask-image']).toBeUndefined()
        expect(wrapper.find('.nv-loading-mask > svg').exists()).toBe(true)
      } finally {
        wrapper.unmount()
      }
    },
  )

  it.each(['ghost', 'ghost-alt'])(
    'preserves %s and generic directive fallback',
    (type) => {
      const { wrapper, owned } = render(type)
      try {
        expect(
          owned.some((rule) => rule.selector.includes('.nv-loading-mask')),
        ).toBe(false)
        expect(
          owned.some(
            (rule) => '--nv-button-loading-surface' in rule.declarations,
          ),
        ).toBe(false)
        const mask = wrapper.get('.nv-loading-mask')
        expect(
          rules
            .filter((rule) =>
              rule.classes.some((name) => mask.classes().includes(name)),
            )
            .map((rule) => rule.declarations),
        ).toContainEqual({
          'background-color':
            'var(--colors-loading-default-pending-background)',
        })
        expect(
          owned
            .filter((rule) => rule.selector.endsWith(' .nv-button__loading'))
            .map((rule) => rule.declarations),
        ).toContainEqual({ 'background-color': 'inherit' })
      } finally {
        wrapper.unmount()
      }
    },
  )
})
