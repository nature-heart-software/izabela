// Test-only medium owner. It can launch only the checksum-pinned graphics copy
// selected by its parent and cleans up through its own retained ChildProcess.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { createRequire } = require('node:module')
const { spawn, execFileSync } = require('node:child_process')
const requireApp = createRequire(
  path.resolve(__dirname, '../../apps/app/package.json'),
)
const sdk = requireApp('electron-game-overlay')
const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const prefix = path.join(config.directory, 'medium-target')
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const write = (suffix, value) => {
  const file = prefix + suffix
  fs.writeFileSync(file + '.tmp', JSON.stringify(value))
  fs.renameSync(file + '.tmp', file)
}
let child, identity
async function main() {
  assert.equal(config.mediumTarget, true)
  assert.equal(config.case, 'd3d11-x64')
  assert.equal(path.basename(config.target), 'd3d11_overlay_test_host.exe')
  const hash = (file) =>
    createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  assert.equal(hash(config.target), config.fixtureSha256)
  assert.equal(hash(config.fixtureSource), config.fixtureSha256)
  const context = await sdk.inspectOverlayConsumerExecutionContext()
  assert.equal(context.elevated, false)
  assert.equal(context.integrityRid, 8192)
  write('.ready.json', context)
  const deadline = Date.now() + 120000
  while (
    !fs.existsSync(prefix + '.start') &&
    !fs.existsSync(prefix + '.stop') &&
    Date.now() < deadline
  )
    await wait(20)
  if (fs.existsSync(prefix + '.stop')) return
  assert.ok(
    fs.existsSync(prefix + '.start'),
    'Owned target launch was requested',
  )
  child = spawn(config.target, [], {
    cwd: path.dirname(config.target),
    windowsHide: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.pipe(fs.createWriteStream(prefix + '.stdout.log'))
  child.stderr.pipe(fs.createWriteStream(prefix + '.stderr.log'))
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve)
    child.once('error', reject)
  })
  const manager = sdk.createReShadeLaunchConfig().addonManagerPath
  identity = JSON.parse(
    execFileSync(manager, ['--query-process-image', String(child.pid)], {
      encoding: 'utf8',
      windowsHide: true,
    }),
  )
  assert.equal(identity.pid, child.pid)
  assert.equal(
    identity.executablePath.toLowerCase(),
    config.target.toLowerCase(),
  )
  write('.started.json', identity)
  while (
    child.exitCode === null &&
    child.signalCode === null &&
    !fs.existsSync(prefix + '.stop') &&
    Date.now() < deadline
  )
    await wait(20)
}
main()
  .catch((error) => {
    write('.error.json', { error: String(error.stack || error) })
    process.exitCode = 1
  })
  .finally(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill()
      await Promise.race([
        new Promise((resolve) => child.once('exit', resolve)),
        wait(5000),
      ])
    }
    if (child && child.exitCode === null && child.signalCode === null) {
      write('.error.json', { error: 'Owned target exit was not confirmed' })
      process.exitCode = 1
      return
    }
    write('.exited.json', {
      ownerPid: process.pid,
      identity,
      exitCode: child?.exitCode ?? null,
      signalCode: child?.signalCode ?? null,
    })
  })
