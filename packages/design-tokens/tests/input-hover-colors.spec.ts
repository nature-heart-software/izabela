import { describe, expect, it } from 'vitest'
import generated from '../src/figma.generated.json'

const controls = ['input', 'textarea', 'number-input', 'select'] as const
const themes = generated.themes.filter(
  ({ id }) => id.startsWith('kumo-') || id.startsWith('github-'),
)

describe('Kumo and GitHub input hover feedback', () => {
  it.each(
    themes.flatMap(({ id }) => controls.map((control) => ({ id, control }))),
  )(
    '$id $control matches default Button hover surface and border',
    ({ id, control }) => {
      const theme = generated.themes.find((theme) => theme.id === id)!.values
      expect(theme[control].default.hover.background).toBe(
        theme.button.default.hover.background,
      )
      expect(theme[control].default.hover.border).toBe(
        theme.button.default.hover.border,
      )
    },
  )
})
