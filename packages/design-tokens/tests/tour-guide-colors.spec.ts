import { describe, expect, it } from 'vitest'
import generated from '../src/figma.generated.json'

describe('Guided tour live application color references', () => {
  it.each([
    ['izabela-light', '#0e0e2c', '#ffffff'],
    ['izabela-dark', '#acacac', '#444444'],
  ])(
    'preserves the inverse Original appearance in %s',
    (id, background, text) => {
      const theme = generated.themes.find((theme) => theme.id === id)
      expect(theme).toBeDefined()
      expect(theme!.values.tourGuide.default.background).toBe(background)
      expect(theme!.values.tourGuide.default.text).toBe(text)
    },
  )

  it('retains independently addressable Tour roles', () => {
    for (const role of ['background', 'text', 'shadow'] as const) {
      expect(generated.semanticTokens.colors.tourGuide.default[role]).toEqual({
        value: `var(--nv-tour-guide-default-${role})`,
      })
    }
  })
})
