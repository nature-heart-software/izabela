import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('executes the application selection and Storybook theme integration contracts', () => {
  const root = new URL('../../../', import.meta.url)
  const files = [
    'apps/app/src/teams/messenger/views/NvSettingsGeneral.test.mjs',
    'apps/app/src/features/settings/store/index.test.mjs',
    'apps/app/src/teams/messenger/App.test.mjs',
    'apps/app/src/components/theme-consumers.test.mjs',
    'packages/ui/.storybook/preview.test.mjs',
  ]
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const result = spawnSync(
    process.execPath,
    ['--test', ...files.map((file) => fileURLToPath(new URL(file, root)))],
    { env, encoding: 'utf8', timeout: 60000 },
  )
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
  expect(result.error, output).toBeUndefined()
  expect(result.status, output).toBe(0)
  expect(result.stdout).toMatch(/(?:fail|failed) 0/)
}, 70000)
