import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('select migration boundaries', () => {
  it('keeps Select and Autocomplete free from Element Plus and runtime styled components', () => {
    for (const file of [
      'Select/select.panda.ts',
      'Select/NvSelect.vue',
      'Autocomplete/autocomplete.panda.ts',
      'Autocomplete/NvAutocomplete.vue',
    ]) {
      let source = ''
      try {
        source = readFileSync(
          new URL(`../src/components/forms/${file}`, import.meta.url),
          'utf8',
        )
      } catch {}
      expect(source, file).not.toBe('')
      expect(source, file).not.toMatch(/element-plus|vue3-styled-components/)
    }
  })
})
