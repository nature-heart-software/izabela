import { describe, expect, it } from 'vitest'
import generated from '../src/figma.generated.json'

function rgba(value: string): number[] {
  if (/^#[\da-f]{6}$/i.test(value)) {
    return [
      parseInt(value.slice(1, 3), 16),
      parseInt(value.slice(3, 5), 16),
      parseInt(value.slice(5, 7), 16),
      1,
    ]
  }
  const match = value.match(/^rgba\(([^)]+)\)$/)
  if (!match) throw new Error(`Unexpected generated color: ${value}`)
  const channels = match[1].split(',').map(Number)
  if (channels.length !== 4 || !channels.every(Number.isFinite))
    throw new Error(`Unexpected generated color channels: ${value}`)
  return channels
}

describe('Select group and readonly label masks', () => {
  it.each(
    generated.themes.map(({ id, label, values }) => ({
      id,
      label,
      maskColor: values.option.default.readonly['label-mask-background'],
      popupColor: values.autocomplete.default.background,
    })),
  )(
    '$label mask matches the autocomplete popup including alpha',
    ({ maskColor, popupColor }) => {
      expect(rgba(maskColor)).toEqual(rgba(popupColor))
    },
  )

  it('retains independent semantic roles and a registered default theme', () => {
    expect(generated.themes.length).toBeGreaterThan(0)
    expect(
      generated.themes.find(({ id }) => id === generated.defaultThemeId),
    ).toBeDefined()
    expect(
      generated.semanticTokens.colors.option.default.readonly[
        'label-mask-background'
      ],
    ).toEqual({
      value: 'var(--nv-option-default-readonly-label-mask-background)',
    })
    expect(
      generated.semanticTokens.colors.autocomplete.default.background,
    ).toEqual({
      value: 'var(--nv-autocomplete-default-background)',
    })
  })
})
