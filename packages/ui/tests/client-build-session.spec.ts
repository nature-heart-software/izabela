import { expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildForSession } from './client-build-session.mjs'

it('reuses the shared client only within the same package run', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'ui-build-session-'))
  const output = join(directory, 'client.js')
  let builds = 0
  const build = async () => {
    writeFileSync(output, String(++builds))
  }
  try {
    await buildForSession('first', output, build)
    await buildForSession('first', output, build)
    expect(builds).toBe(1)
    await buildForSession('second', output, build)
    expect(builds).toBe(2)
    rmSync(output)
    await buildForSession('second', output, build)
    expect(builds).toBe(3)
    await buildForSession(undefined, output, build)
    await buildForSession(undefined, output, build)
    expect(builds).toBe(5)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
