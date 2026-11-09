import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

// A fresh runner identity prevents reuse across invocations or source revisions.
// Package suites run serially and share this one immutable compiled fixture.
export async function buildForSession(session, output, build) {
  const marker = `${output}.session`
  if (
    session &&
    existsSync(output) &&
    existsSync(marker) &&
    readFileSync(marker, 'utf8') === session
  )
    return
  rmSync(marker, { force: true })
  await build()
  if (session) writeFileSync(marker, session)
}
