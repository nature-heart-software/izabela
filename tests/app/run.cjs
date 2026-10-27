const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { spawn, execFileSync } = require('node:child_process')
const {
  inventory,
  assertInventoryCoverage,
  retiredVariables,
} = require('./providers.cjs')
const {
  coreCases,
  validateResults,
  redactor,
  additionalCases,
} = require('./contracts.cjs')

const root = path.resolve(__dirname, '../..')
const live = process.argv.includes('--live')
const appRoot = path.resolve(
  root,
  process.argv.find((arg) => arg.startsWith('--app-root='))?.slice(11) ||
    'apps/app',
)
const packaged = appRoot.endsWith('.asar')
const configured = inventory(process.env)
if (live) assertInventoryCoverage(process.env)
assert.equal(process.platform, 'win32', 'App end-to-end tests require Windows')
if (live)
  assert.ok(
    configured.filter((p) => p.enabled && p.env.length).length > 0,
    'No provider credentials found. Run this command through Infisical dev.',
  )
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'izabela-app-e2e-'))
const reportDirectory = path.join(
  root,
  'coverage/app-results',
  (live ? 'live' : 'offline') + (packaged ? '-packaged' : ''),
)
fs.mkdirSync(reportDirectory, { recursive: true })
const redact = redactor(process.env)
let child
let output = ''
const results = []

function pnpm(args) {
  const options = {
    cwd: root,
    env: {
      ...process.env,
      VITE_DISABLE_AUTO_UPDATE: 'true',
      NX_DAEMON: 'false',
    },
    windowsHide: true,
    stdio: 'inherit',
  }
  if (process.env.npm_execpath)
    execFileSync(process.execPath, [process.env.npm_execpath, ...args], options)
  else execFileSync('pnpm.cmd', args, { ...options, shell: true })
}
async function run() {
  for (const port of [
    Number(process.env.VITE_SERVER_PORT || 7070),
    Number(process.env.VITE_SERVER_WS_PORT || 7071),
  ]) {
    await new Promise((resolve, reject) => {
      const server = require('node:net').createServer()
      server.once('error', () =>
        reject(
          new Error(
            `Port ${port} is occupied; close the running Izabela instance before testing`,
          ),
        ),
      )
      server.listen(port, () => server.close(resolve))
    })
  }
  if (process.argv.includes('--build')) {
    pnpm(['build:deps'])
    pnpm(['--filter', 'izabela-next', 'exec', 'vite', 'build'])
    pnpm(['--filter', 'izabela-next', 'run', 'rebuild'])
  }
  assert.ok(
    fs.existsSync(
      packaged ? appRoot : path.join(appRoot, 'dist-electron/background.js'),
    ),
    'Build the production app first, or pass --build',
  )
  const config = {
    directory,
    reportDirectory,
    live,
    appRoot,
    providers: configured.filter((p) => p.enabled),
    excluded: [
      ...configured
        .filter((p) => !p.enabled)
        .map((p) => ({ kind: p.kind, name: p.name, missing: p.missing })),
      ...Object.entries(retiredVariables)
        .filter(([key]) => process.env[key])
        .map(([key, name]) => ({ kind: 'unsupported', name, variable: key })),
    ],
  }
  // This file contains paths and provider names, never credential values.
  fs.writeFileSync(path.join(directory, 'run.json'), JSON.stringify(config))
  const executable = require('electron')
  child = spawn(
    executable,
    [path.join(__dirname, 'runtime.cjs'), path.join(directory, 'run.json')],
    {
      cwd: path.join(root, 'apps/app'),
      env: { ...process.env, ELECTRON_ENABLE_LOGGING: '' },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  let pending = ''
  const consume = (chunk) => {
    pending += chunk.toString()
    let index
    while ((index = pending.indexOf('\n')) >= 0) {
      const line = redact(pending.slice(0, index)).trim()
      pending = pending.slice(index + 1)
      output = (output + line + '\n').slice(-200000)
      const marker = line.match(/(?:^| > )APP_TEST (\{.*\})$/)
      if (marker) {
        const result = JSON.parse(marker[1])
        results.push(result)
        console.log(
          `${result.pass ? 'PASS' : 'FAIL'} ${result.name} (${
            result.duration
          } ms)${result.error ? ': ' + result.error : ''}`,
        )
      }
    }
    fs.writeFileSync(path.join(reportDirectory, 'app.log'), output)
  }
  child.stdout.on('data', consume)
  child.stderr.on('data', consume)
  const timeout = setTimeout(
    () => {
      stop()
    },
    live ? 20 * 60000 : 3 * 60000,
  )
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', resolve)
  })
  clearTimeout(timeout)
  const expected = [
    ...coreCases,
    ...(live
      ? [
          ...config.providers.map((p) => `${p.kind}: ${p.name}`),
          ...additionalCases(config.providers),
        ]
      : []),
  ]
  const report = {
    live,
    packaged,
    expected,
    results,
    excluded: config.excluded,
    exitCode: code,
  }
  fs.writeFileSync(
    path.join(reportDirectory, 'summary.json'),
    JSON.stringify(report, null, 2),
  )
  fs.writeFileSync(path.join(reportDirectory, 'app.log'), output)
  validateResults(results, expected)
  assert.equal(code, 0, 'App process failed; see coverage/app-results')
}
function stop() {
  if (child && child.exitCode === null) {
    try {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      })
    } catch {}
  }
}
function releaseTestKeys() {
  if (!child) return
  try {
    const koffi = require(path.join(root, 'apps/app/node_modules/koffi'))
    const keyEvent = koffi
      .load('user32.dll')
      .func(
        'void __stdcall keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)',
      )
    for (let number = 13; number <= 21; number++)
      keyEvent(111 + number, 0, 2, 0)
  } catch {}
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    stop()
    process.exitCode = 1
  })
run()
  .catch((error) => {
    console.error(redact(error.message))
    process.exitCode = 1
  })
  .finally(() => {
    stop()
    releaseTestKeys()
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
    assert.ok(path.basename(directory).startsWith('izabela-app-e2e-'))
    fs.rmSync(directory, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    })
  })
