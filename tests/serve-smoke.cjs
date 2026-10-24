const assert = require('node:assert/strict')
const { spawn, execFileSync } = require('node:child_process')

const failure =
  /error TS\d+|gyp ERR!|\[(?:error|ELIFECYCLE)\]|Couldn't (?:register|unregister)|Unable to load preload|Invalid watch source|Uncaught|UnhandledPromiseRejection|(?:^|\n)\s*(?:TypeError|ReferenceError|Error):|:ERROR:/i
const page = 'http://localhost:3000/src/teams/messenger/index.html'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let child
let stopping = false

function stop() {
  if (!child || stopping) return
  stopping = true
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      })
    } else {
      child.kill('SIGTERM')
    }
  } catch (error) {
    if (child.exitCode === null) throw error
  }
}

async function main() {
  assert.equal(process.platform, 'win32', 'desktop validation requires Windows')
  for (const port of [3000, 7070]) {
    const { createConnection } = require('node:net')
    const occupied = await new Promise((resolve) => {
      const socket = createConnection({ host: 'localhost', port })
      socket.once('connect', () => {
        socket.destroy()
        resolve(true)
      })
      socket.once('error', () => resolve(false))
    })
    assert.equal(occupied, false, `port ${port} is already in use`)
  }

  let output = ''
  let exited = false
  let spawnError
  child = process.env.npm_execpath
    ? spawn(process.execPath, [process.env.npm_execpath, 'serve'], {
        env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    : spawn('pnpm', ['serve'], {
        env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
        shell: true,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
  const consume = (chunk) => {
    const text = chunk.toString()
    process.stdout.write(text)
    output += text.replace(/\u001b\[[0-9;]*m/g, '')
  }
  child.stdout.on('data', consume)
  child.stderr.on('data', consume)
  child.on('error', (error) => {
    spawnError = error
  })
  child.on('exit', () => {
    exited = true
  })

  const deadline = Date.now() + 15 * 60 * 1000
  let readySince
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError
    assert.equal(exited, false, 'pnpm serve exited before validation completed')
    assert.doesNotMatch(
      output,
      failure,
      'a build or application startup error was logged',
    )
    if (
      output.includes('App server now running on port 7070') &&
      output.includes('[game-overlay] Starting overlay...') &&
      (output.match(/\[socket.io\] Connected:/g) || []).length >= 4
    ) {
      const response = await fetch(page, { signal: AbortSignal.timeout(5000) })
      assert.equal(response.status, 200)
      readySince ??= Date.now()
      if (Date.now() - readySince >= 10000) {
        console.log(
          'PASS serve: HTTP 200, API and overlay initialized, four renderer connections, no startup errors',
        )
        return
      }
    }
    await wait(1000)
  }
  throw new Error('Timed out waiting for the development app to initialize')
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stop()
    process.exit(1)
  })
}
main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(stop)
