import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import loadTypescript from '../../../tests/load-typescript.cjs'

for (const [search, overlay, experimental] of [
  ['', false, false],
  ['?experimental-game-overlay', false, false],
  ['?game-overlay', true, false],
  ['?game-overlay&experimental-game-overlay', true, true],
]) {
  test(`renderer identity comes from its launch URL (${
    search || 'desktop'
  })`, () => {
    const flags = loadTypescript(
      fileURLToPath(new URL('./consts.ts', import.meta.url)),
      {},
      { location: { search }, URLSearchParams },
    )
    assert.equal(flags.isGameOverlay, overlay)
    assert.equal(flags.isExperimentalGameOverlay, experimental)
  })
}
