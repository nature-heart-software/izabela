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
  const actions = []
  const app = Object.assign(new EventEmitter(), {
    whenReady: () => Promise.resolve(),
    getVersion: () => '6.6.6',
    name: 'Izabela',
    relaunch() {
      actions.push('relaunch')
    },
    exit() {
      actions.push('exit')
      app.emit('quit', {}, 0)
    },
    quit() {
      actions.push('quit')
      app.emit('before-quit')
      app.emit('quit', {}, 0)
    },
  })
  // Keep the updater's real quit/install logic; control only Electron and I/O.
  const {
    ElectronAppAdapter,
  } = require('electron-updater/out/ElectronAppAdapter')
  const updater = new BaseUpdater(null, new ElectronAppAdapter(app))
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
  const globals = {
    __importMetaEnv: { VITE_DISABLE_AUTO_UPDATE: disabled },
    console: { log() {}, warn() {} },
  }
  let restartPolicy
  const loadRestartPolicy = () =>
    (restartPolicy ??= loadTypescript(
      fileURLToPath(new URL('./restart.ts', import.meta.url)),
      mocks,
      globals,
    ))
  const mocks = {
    'electron-updater': { autoUpdater: updater },
    electron: { app },
    get './restart'() {
      return loadRestartPolicy()
    },
    get '@/modules/electron-updater/restart'() {
      return loadRestartPolicy()
    },
    '@/features/settings/store': {
      useSettingsStore: () => ({
        $whenReady: () => Promise.resolve(),
        enableAutoUpdate: enabled,
        updateChannel: 'latest',
      }),
    },
    '@/utils/electron-notification': { createNotification: () => ({}) },
  }
  const register = loadTypescript(
    fileURLToPath(new URL('./register.ts', import.meta.url)),
    mocks,
    globals,
  ).default
  await register()
  // Execute the actual UI restart binding, including its current imports.
  const filename = fileURLToPath(
    new URL(
      'teams/messenger/modules/electron-messenger-window/index.ts',
      appRoot,
    ),
  )
  const ast = ts.createSourceFile(
    filename,
    readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  let expression
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'restart')
      expression = node.initializer.getText(ast)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.ok(expression, 'messenger restart handler exists')
  const imports = ast.statements
    .filter(
      (node) =>
        ts.isImportDeclaration(node) &&
        ['electron', '@/modules/electron-updater/restart'].includes(
          node.moduleSpecifier.text,
        ),
    )
    .map((node) => node.getText(ast))
    .join('\n')
  const { restart } = loadTypescript(
    filename,
    mocks,
    globals,
    `${imports}\nexport const restart = ${expression}`,
  )
  return { checks, updater, app, installs, downloadUpdate, restart, actions }
}

test('Quit installs a downloaded update silently without relaunching', async () => {
  const { app, updater, installs, downloadUpdate } = await registerUpdater(
    undefined,
  )
  downloadUpdate()
  updater.emit('update-downloaded', {})
  assert.equal(installs.length, 0, 'downloading must not interrupt the app')
  app.quit()
  await new Promise(setImmediate)
  assert.equal(installs.length, 1, 'the update must install only once')
  assert.equal(installs[0].isSilent, true)
  assert.equal(installs[0].isForceRunAfter, false)
})

test('Restart installs a downloaded update before reopening instead of scheduling a competing relaunch', async () => {
  const { restart, actions, installs, downloadUpdate } = await registerUpdater(
    undefined,
  )
  downloadUpdate()
  assert.equal(installs.length, 0)
  restart()
  await new Promise(setImmediate)
  assert.equal(installs.length, 1)
  assert.equal(installs[0].isSilent, true)
  assert.equal(installs[0].isForceRunAfter, true)
  assert.deepEqual(actions, ['quit'])
})

async function trayRestartHandler(app, restart) {
  let menu
  const createTray = loadTypescript(
    fileURLToPath(new URL('teams/tray/electron-tray.ts', appRoot)),
    {
      electron: {
        app,
        Menu: { buildFromTemplate: (items) => items },
        screen: {
          getPrimaryDisplay: () => ({ id: 1 }),
          getAllDisplays: () => [],
        },
        Tray: class {
          setContextMenu(items) {
            menu = items
          }
          setToolTip() {}
          on() {}
        },
      },
      '@/teams/messenger/modules/electron-messenger-window': {
        restart,
        show() {},
      },
      '@/features/settings/store': { useSettingsStore: () => ({}) },
      '@/electron/utils.ts': { PUBLIC_DIR: 'public' },
      vue: { watch() {} },
    },
  ).default
  await createTray()
  return menu.find((item) => item.label === 'Restart').click
}

test('tray Restart installs a downloaded update before reopening', async () => {
  const { app, restart, actions, installs, downloadUpdate } =
    await registerUpdater(undefined)
  const click = await trayRestartHandler(app, restart)
  downloadUpdate()
  click()
  await new Promise(setImmediate)
  assert.equal(installs.length, 1)
  assert.equal(installs[0].isForceRunAfter, true)
  assert.deepEqual(actions, ['quit'])
})

for (const source of ['messenger', 'tray']) {
  for (const reentrant of [false, true]) {
    test(`${source} Restart coalesces ${
      reentrant ? 'reentrant' : 'duplicate'
    } UI and tray requests before the updater quits`, async () => {
      const { app, updater, restart, actions, installs, downloadUpdate } =
        await registerUpdater(undefined)
      const trayRestart = await trayRestartHandler(app, restart)
      const first = source === 'messenger' ? restart : trayRestart
      const second = source === 'messenger' ? trayRestart : restart
      if (reentrant) {
        const doInstall = updater.doInstall
        updater.doInstall = (options) => {
          const result = doInstall(options)
          second()
          return result
        }
      }
      downloadUpdate()
      first()
      second()
      assert.deepEqual(actions, [], 'quit must still be scheduled, not drained')
      await new Promise(setImmediate)
      assert.equal(installs.length, 1, 'Restart must launch only one installer')
      assert.equal(installs[0].isSilent, true)
      assert.equal(installs[0].isForceRunAfter, true)
      assert.deepEqual(actions, ['quit'])
    })
  }
}

for (const failure of ['throw', 'error']) {
  test(`Restart permits retry after a synchronous installer ${failure} without a competing relaunch`, async () => {
    const { app, updater, restart, actions, installs, downloadUpdate } =
      await registerUpdater(undefined)
    const trayRestart = await trayRestartHandler(app, restart)
    const errors = []
    const installError = new Error('installer failed')
    updater.on('error', (error) => {
      errors.push(error)
      // A retry from error delivery must wait for BaseUpdater to unwind.
      if (error === installError) trayRestart()
    })
    const errorListeners = updater.listenerCount('error')
    const doInstall = updater.doInstall
    updater.doInstall = (options) => {
      doInstall(options)
      if (installs.length === 1) {
        if (failure === 'throw') throw installError
        updater.dispatchError(installError)
        return false
      }
      return true
    }
    downloadUpdate()
    restart()
    await new Promise(setImmediate)
    assert.deepEqual(errors, [installError])
    assert.equal(installs.length, 1)
    assert.deepEqual(actions, [], 'a failed install must not quit or relaunch')
    assert.equal(updater.listenerCount('error'), errorListeners)
    trayRestart()
    assert.equal(
      installs.length,
      2,
      'a real installation failure must allow retry',
    )
    // Unrelated errors after the install call must not unlock a pending quit.
    updater.emit('error', new Error('unrelated update check failed'))
    restart()
    assert.deepEqual(actions, [])
    await new Promise(setImmediate)
    assert.equal(
      installs.length,
      2,
      'the successful retry must install only once',
    )
    for (const options of installs) {
      assert.equal(options.isSilent, true)
      assert.equal(options.isForceRunAfter, true)
    }
    assert.deepEqual(actions, ['quit'])
    assert.equal(updater.listenerCount('error'), errorListeners)
  })
}

for (const source of ['messenger', 'tray']) {
  for (const available of [false, true]) {
    test(`${source} Restart without a completed download restarts normally (update available: ${available})`, async () => {
      const { app, updater, restart, installs, actions } =
        await registerUpdater(undefined)
      if (available) updater.emit('update-available', {})
      const click =
        source === 'tray' ? await trayRestartHandler(app, restart) : restart
      click()
      await new Promise(setImmediate)
      assert.deepEqual(actions, ['relaunch', 'exit'])
      assert.deepEqual(installs, [])
    })
  }
}

for (const [disabled, enabled] of [
  ['true', true],
  [undefined, false],
]) {
  test(`Restart remains ordinary when updates are disabled (build policy: ${disabled})`, async () => {
    const { restart, actions, installs } = await registerUpdater(
      disabled,
      enabled,
    )
    restart()
    await new Promise(setImmediate)
    assert.deepEqual(actions, ['relaunch', 'exit'])
    assert.deepEqual(installs, [])
  })
}

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
      for (const [entry, method] of [
        ['./register.ts', 'checkForUpdatesAndNotify'],
        ['./restart.ts', 'quitAndInstall'],
      ]) {
        const output = await build({
          configFile: false,
          root,
          publicDir: false,
          logLevel: 'silent',
          build: {
            write: false,
            minify: false,
            lib: {
              entry: fileURLToPath(new URL(entry, import.meta.url)),
              formats: ['es'],
            },
            rollupOptions: { external: (id) => !isAbsolute(id) },
          },
        })
        const bundle = Array.isArray(output) ? output[0] : output
        const code = bundle.output.find((chunk) => chunk.type === 'chunk').code
        assert.equal(code.includes(method), !disabled)
        assert.equal(code.includes('VITE_DISABLE_AUTO_UPDATE'), false)
      }
    }
  } finally {
    if (previous === undefined) delete process.env.VITE_DISABLE_AUTO_UPDATE
    else process.env.VITE_DISABLE_AUTO_UPDATE = previous
    rmSync(root, { recursive: true, force: true })
  }
})
