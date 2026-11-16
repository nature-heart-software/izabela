import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { build } from 'vite'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const appRoot = new URL('../../', import.meta.url)
const require = createRequire(import.meta.url)
// Initialize the public entry first to preserve the updater's circular imports.
require('electron-updater')
const { BaseUpdater } = loadTypescript(
  require.resolve('electron-updater/out/BaseUpdater'),
  {
    './AppUpdater': require('electron-updater/out/AppUpdater'),
    electron: { autoUpdater: new EventEmitter() },
  },
  { setImmediate },
)

async function registerUpdater(disabled, enabled = true) {
  const checks = []
  const installs = []
  const app = Object.assign(new EventEmitter(), {
    whenReady: () => Promise.resolve(),
    getVersion: () => '6.6.6',
    name: 'Izabela',
    quit() {
      app.emit('before-quit')
      app.emit('quit', {}, 0)
    },
  })
  // Keep the updater's real quit/install logic; control only Electron and I/O.
  const updater = new BaseUpdater(null, {
    version: app.getVersion(),
    onQuit: (callback) => app.on('quit', (_, code) => callback(code)),
    quit: () => app.quit(),
  })
  updater.logger = null
  updater.checkForUpdatesAndNotify = async (...args) => checks.push(args)
  updater.doInstall = (options) => {
    installs.push(options)
    return true
  }
  const downloadUpdate = () => {
    updater.downloadedUpdateHelper = {
      file: 'downloaded-update.exe',
      downloadedFileInfo: {},
    }
    updater.emit('update-downloaded', {})
    updater.addQuitHandler()
  }
  const register = loadTypescript(
    fileURLToPath(new URL('./register.ts', import.meta.url)),
    {
      'electron-updater': { autoUpdater: updater },
      electron: { app },
      '@/features/settings/store': {
        useSettingsStore: () => ({
          $whenReady: () => Promise.resolve(),
          enableAutoUpdate: enabled,
          updateChannel: 'latest',
        }),
      },
      '@/utils/electron-notification': { createNotification: () => ({}) },
    },
    {
      __importMetaEnv: { VITE_DISABLE_AUTO_UPDATE: disabled },
      console: { log() {}, warn() {} },
    },
  ).default
  await register()
  return { checks, updater, app, installs, downloadUpdate }
}

test('a downloaded update waits for exit then installs silently with relaunch requested', async () => {
  const { app, updater, installs, downloadUpdate } = await registerUpdater(
    undefined,
  )
  downloadUpdate()
  updater.emit('update-downloaded', {})
  assert.equal(app.listenerCount('before-quit'), 1)
  assert.equal(installs.length, 0, 'downloading must not interrupt the app')
  app.quit()
  await new Promise(setImmediate)
  assert.equal(installs.length, 1, 'the update must install only once')
  assert.equal(installs[0].isSilent, true)
  assert.equal(installs[0].isForceRunAfter, true)
})

test('quitting without a downloaded update does not install or relaunch', async () => {
  const { app, installs } = await registerUpdater(undefined)
  assert.equal(app.listenerCount('before-quit'), 0)
  app.quit()
  await new Promise(setImmediate)
  assert.deepEqual(installs, [])
})

test('disabled automatic updates do not register installation hooks', async () => {
  const { app, updater } = await registerUpdater(undefined, false)
  assert.equal(updater.listenerCount('update-downloaded'), 0)
  assert.equal(app.listenerCount('before-quit'), 0)
})

test('artifact builds never initialize update checks even when saved settings enable updates', async () => {
  const { checks, updater, app } = await registerUpdater('true')
  assert.equal(checks.length, 0)
  assert.equal(updater.channel, null)
  assert.equal(updater.listenerCount('update-downloaded'), 0)
  assert.equal(app.listenerCount('before-quit'), 0)
})

test('ordinary builds retain automatic updates and respect the saved preference', async () => {
  for (const flag of [undefined, 'false']) {
    const { checks, updater } = await registerUpdater(flag)
    assert.equal(checks.length, 1)
    assert.equal(updater.channel, 'latest')
    assert.equal(updater.allowDowngrade, false)
    assert.equal((await registerUpdater(flag, false)).checks.length, 0)
  }
})

function recovery(disabled) {
  const filename = fileURLToPath(new URL('electron/background.ts', appRoot))
  const ast = ts.createSourceFile(
    filename,
    readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  let expression
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'fallback')
      expression = node.initializer.getText(ast)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.ok(expression)
  const imports = ast.statements
    .filter(ts.isImportDeclaration)
    .map((node) => node.getText(ast))
    .join('\n')
  const calls = []
  const result = loadTypescript(
    filename,
    {
      electron: { app: { getVersion: () => '6.6.6' } },
      'electron-updater': {
        autoUpdater: {
          on: (event) => calls.push(event),
          quitAndInstall: () => calls.push('install'),
          checkForUpdates: async () => calls.push('check'),
        },
      },
    },
    {
      __importMetaEnv: { VITE_DISABLE_AUTO_UPDATE: disabled },
      console: { log() {} },
    },
    `${imports}\nexport const fallback = ${expression}`,
  )
  return { fallback: result.fallback, calls }
}

test('artifact builds cannot re-enable updates through startup-error recovery', async () => {
  const { fallback, calls } = recovery('true')
  await fallback('synthetic startup failure')
  assert.deepEqual(calls, [])
})

test('ordinary builds retain startup-error recovery updates', async () => {
  const { fallback, calls } = recovery(undefined)
  await fallback('synthetic startup failure')
  assert.deepEqual(calls, ['update-downloaded', 'check'])
})

test('Vite bakes the action-only update policy into the production bundle', async () => {
  const root = mkdtempSync(join(tmpdir(), 'izabela-update-policy-'))
  const previous = process.env.VITE_DISABLE_AUTO_UPDATE
  try {
    for (const disabled of [true, false]) {
      if (disabled) process.env.VITE_DISABLE_AUTO_UPDATE = 'true'
      else delete process.env.VITE_DISABLE_AUTO_UPDATE
      const output = await build({
        configFile: false,
        root,
        publicDir: false,
        logLevel: 'silent',
        build: {
          write: false,
          minify: false,
          lib: {
            entry: fileURLToPath(new URL('./register.ts', import.meta.url)),
            formats: ['es'],
          },
          rollupOptions: { external: (id) => !isAbsolute(id) },
        },
      })
      const bundle = Array.isArray(output) ? output[0] : output
      const code = bundle.output.find((chunk) => chunk.type === 'chunk').code
      assert.equal(code.includes('checkForUpdatesAndNotify'), !disabled)
      assert.equal(code.includes('VITE_DISABLE_AUTO_UPDATE'), false)
    }
  } finally {
    if (previous === undefined) delete process.env.VITE_DISABLE_AUTO_UPDATE
    else process.env.VITE_DISABLE_AUTO_UPDATE = previous
    rmSync(root, { recursive: true, force: true })
  }
})
