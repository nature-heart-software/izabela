import { expect, it } from 'vitest'
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
  return match[1].split(',').map(Number)
}

it.each(
  generated.themes.map(({ label, values }) => ({
    label,
    cardColor: values.card.default.background,
    maskColor: values.accessBlocker.default.denied.background,
  })),
)(
  '$label access-blocker mask uses card RGB at the intended 90% alpha',
  ({ cardColor, maskColor }) => {
    const card = rgba(cardColor)
    const mask = rgba(maskColor)
    expect(mask.slice(0, 3)).toEqual(card.slice(0, 3))
    expect(mask[3]).toBeCloseTo(0.9, 6)
  },
)
