import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { normalizeDiagnosticSpan } from './diagnostic-spans.mjs'

it('matches all real template baseline spans in LF and CRLF coordinates', () => {
  const baseline = JSON.parse(
    readFileSync(
      fileURLToPath(
        new URL('./declaration-template-baseline.json', import.meta.url),
      ),
      'utf8',
    ),
  )
  expect(baseline).toHaveLength(35)
  for (const diagnostic of baseline) {
    const text = readFileSync(
      fileURLToPath(new URL(`../${diagnostic.file}`, import.meta.url)),
      'utf8',
    ).replace(/\r\n/g, '\n')
    const { start, length } = diagnostic
    expect(start + length).toBeLessThanOrEqual(text.length)
    expect
      .soft(
        { ...diagnostic, ...normalizeDiagnosticSpan(text, start, length) },
        `${diagnostic.file}:${start} LF`,
      )
      .toEqual(diagnostic)
    const crlf = text.replace(/\n/g, '\r\n')
    const crlfStart = text.slice(0, start).replace(/\n/g, '\r\n').length
    const crlfLength = text
      .slice(start, start + length)
      .replace(/\n/g, '\r\n').length
    expect
      .soft(
        {
          ...diagnostic,
          ...normalizeDiagnosticSpan(crlf, crlfStart, crlfLength),
        },
        `${diagnostic.file}:${start} CRLF`,
      )
      .toEqual(diagnostic)
  }
  // Span lengths, like starts, use UTF-16 offsets and can cross line endings.
  expect
    .soft(normalizeDiagnosticSpan('😀\r\nfirst\r\nsecond\r\n', 4, 15))
    .toEqual({
      start: 3,
      length: 13,
    })
})
