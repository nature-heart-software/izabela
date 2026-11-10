// Explicit administrator-terminal check. Normal graphics tests never request UAC.
// The unmodified SDK launches only this Node executable as the same desktop user.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const requireApp = createRequire(
  path.resolve(__dirname, '../apps/app/package.json'),
)
const sdk = requireApp('electron-game-overlay')
const directory = path.resolve(__dirname, '../coverage/experimental-overlay')
const report = path.join(directory, 'elevated-consumer.json')
const replacementReport = path.join(
  directory,
  'elevated-consumer-replacement.json',
)
const literals = [
  'with spaces',
  '',
  'quote"here',
  'trailing\\',
  '$(literal)',
  '日本語',
]
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function write(file, value) {
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2) + '\n')
  fs.renameSync(file + '.tmp', file)
}

async function main() {
  assert.equal(process.platform, 'win32')
  const context = await sdk.inspectOverlayConsumerExecutionContext()
  if (process.argv[2] === '--replacement') {
    assert.equal(context.overlaySupported, true)
    assert.equal(context.elevated, false)
    assert.equal(context.integrityRid, 8192)
    write(replacementReport, {
      kind: 'izabela-overlay-elevation-replacement-v1',
      context,
      arguments: process.argv.slice(3),
      inheritedSentinel:
        process.env.IZABELA_ELEVATION_TEST_SENTINEL !== undefined,
    })
    return
  }
  assert.equal(
    process.argv.length,
    2,
    'No arbitrary executable or path is accepted',
  )
  assert.equal(
    context.elevated,
    true,
    'Run this check from an administrator terminal',
  )
  assert.equal(context.overlaySupported, true)
  assert.equal(context.relaunchAvailable, true, context.relaunchRefusal)
  if (fs.existsSync(replacementReport)) {
    const previous = JSON.parse(fs.readFileSync(replacementReport, 'utf8'))
    assert.equal(previous.kind, 'izabela-overlay-elevation-replacement-v1')
    fs.unlinkSync(replacementReport)
  }
  process.env.IZABELA_ELEVATION_TEST_SENTINEL = 'must-not-inherit'
  const result = await sdk.launchUnelevatedOverlayConsumer({
    context,
    arguments: [__filename, '--replacement', ...literals],
  })
  assert.equal(result.status, 'launched')
  const deadline = Date.now() + 40000
  while (!fs.existsSync(replacementReport) && Date.now() < deadline)
    await wait(25)
  const child = JSON.parse(fs.readFileSync(replacementReport, 'utf8'))
  assert.equal(child.context.ownerPid, result.replacement.pid)
  assert.equal(
    child.context.creationTime100ns,
    result.replacement.creationTime100ns,
  )
  assert.equal(
    child.context.executablePath.toLowerCase(),
    context.executablePath.toLowerCase(),
  )
  assert.equal(child.context.executableSha256, context.executableSha256)
  assert.equal(child.context.sessionId, context.sessionId)
  assert.equal(child.inheritedSentinel, false)
  assert.deepEqual(child.arguments, literals)
  write(report, {
    kind: 'izabela-overlay-elevation-validation-v1',
    status: 'passed',
    sdkVersion: requireApp('electron-game-overlay/package.json').version,
    context,
    child,
    actualElevatedRelaunch: true,
    graphics: false,
    injection: false,
    antivirusSettingsChanged: false,
  })
  console.log(
    `PASS elevated consumer -> normal-permission replacement: ${report}`,
  )
}

main().catch((error) => {
  console.error(error.stack || error)
  process.exitCode = 1
})
