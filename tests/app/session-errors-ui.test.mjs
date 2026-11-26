import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

test(
  'session error controls and Ark toast lifecycle work in the renderer',
  { timeout: 120000 },
  () => {
    const root = fileURLToPath(new URL('../../', import.meta.url))
    const result = spawnSync(
      process.execPath,
      [
        'node_modules/vitest/vitest.mjs',
        'run',
        'packages/ui/tests/session-errors.spec.ts',
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          pnpm_config_verify_deps_before_run: 'false',
          npm_config_ignore_scripts: 'true',
        },
        encoding: 'utf8',
        timeout: 110000,
        maxBuffer: 4 * 1024 * 1024,
      },
    )
    assert.ifError(result.error)
    assert.equal(result.status, 0, result.stdout + result.stderr)
  },
)
