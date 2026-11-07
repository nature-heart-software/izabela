import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('keeps workspace overlays independent of Tippy packages and public imports', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--test',
      fileURLToPath(
        new URL(
          '../../../tests/overlay-dependencies.test.mjs',
          import.meta.url,
        ),
      ),
    ],
    { encoding: 'utf8', timeout: 30000 },
  )
  expect(result.error, result.stderr).toBeUndefined()
  expect(result.status, result.stdout + result.stderr).toBe(0)
})
