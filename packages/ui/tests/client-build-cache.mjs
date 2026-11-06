import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Inputs are immutable and callers are serial within one test subprocess.
// A fresh invocation identity prevents reuse across independent test runs.
export async function withClientBuildCache(outputDirectory, build) {
  const runId = process.env.UI_TEST_RUN_ID
  const identified = typeof runId === 'string' && runId.trim().length > 0
  const marker = join(outputDirectory, '.client-build-success')
  const outputsExist = () =>
    ['test-client.js', 'style.css'].every((name) =>
      existsSync(join(outputDirectory, name)),
    )
  if (
    identified &&
    outputsExist() &&
    existsSync(marker) &&
    readFileSync(marker, 'utf8') === runId
  )
    return

  rmSync(marker, { force: true })
  await build()
  if (identified && outputsExist()) writeFileSync(marker, runId)
}
