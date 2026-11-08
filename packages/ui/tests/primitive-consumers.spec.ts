import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const sourceRoot = new URL('../src/', import.meta.url)
describe('canonical primitive consumers', () => {
  it('sizes the native icon from scalar fontSize values', () => {
    const source = readFileSync(
      new URL('components/typography/Icon/NvIcon.vue', sourceRoot),
      'utf8',
    )
    const expression = source.match(
      /const sizeValue = computed\(\(\) => (.+)\)/,
    )?.[1]
    expect(expression).toBeTruthy()
    expect(
      runInNewContext(expression!, {
        tokens: { fontSize: { 2: 14 } },
        props: { size: 2 },
      }),
    ).toBe(14)
  })
  it('constrains icon sizes to the scalar font-size keys, not spacing-only keys', () => {
    const source = readFileSync(
      new URL('components/typography/Icon/icon.shared.ts', sourceRoot),
      'utf8',
    )
    expect(source).toContain('PropType<keyof typeof tokens.fontSize>')
    for (const file of ['Button/NvButton.vue', 'Select/NvSelect.vue']) {
      const consumer = readFileSync(
        new URL(`components/forms/${file}`, sourceRoot),
        'utf8',
      )
      expect(consumer, file).toContain(
        'Record<Size, keyof typeof tokens.fontSize>',
      )
    }
  })
  it('uses shared line-height and letter-spacing primitives instead of removed numeric aliases', () => {
    const files = readdirSync(new URL('components/', sourceRoot), {
      recursive: true,
    })
      .map(String)
      .filter((name) => name.endsWith('.panda.ts'))
    for (const file of files) {
      const source = readFileSync(
        new URL(`components/${file}`, sourceRoot),
        'utf8',
      )
      expect(source, file).not.toMatch(
        /(?:lineHeight|letterSpacing):\s*'[0-9]|borderWidths\.(?:thin|thick)|(?:borderWidth|borderRightWidth|borderTopWidth):\s*'(?:thin|thick)'|boxShadow:\s*'lg'/,
      )
    }
  })
})
