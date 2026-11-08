import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('executes the importer behavior suite and verifies checked-in generation is current', () => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const suite = execFileSync(
    process.execPath,
    [
      '--test',
      fileURLToPath(new URL('./figma-import.test.mjs', import.meta.url)),
    ],
    { env, encoding: 'utf8', timeout: 20000 },
  )
  expect(suite).toMatch(/(?:fail|failed) 0/)
  const check = execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL('../tools/figma-import.mjs', import.meta.url)),
      '--check',
    ],
    { env, encoding: 'utf8', timeout: 20000 },
  )
  expect(check).toMatch(/Verified \d+ variables and \d+ theme modes/)
})
