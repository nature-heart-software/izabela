// Run in Electron, with an optional packaged app.asar path.
const assert = require('node:assert/strict')
const { existsSync } = require('node:fs')
const { createRequire } = require('node:module')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { app } = require('electron')

const appRoot = path.resolve(process.argv[2] || 'apps/app')
const appRequire = createRequire(path.join(appRoot, 'package.json'))
const resolvePackage = (name) => {
  const filename = appRequire.resolve(name)
  if (appRoot.endsWith('.asar')) {
    assert.ok(
      filename.startsWith(appRoot + path.sep) ||
        filename.startsWith(appRoot + '.unpacked' + path.sep),
      `${name} resolved outside the packaged app: ${filename}`,
    )
  }
  return filename
}
const load = (name) => appRequire(resolvePackage(name))
// win-mouse also supports CLI arguments; do not trigger its CLI when importing it.
process.argv = process.argv.slice(0, 2)
const timeout = setTimeout(() => {
  console.error('Native runtime smoke test timed out')
  app.exit(1)
}, 30000)

app
  .whenReady()
  .then(async () => {
    assert.equal(process.platform, 'win32')
    assert.ok(process.versions.electron, 'must run inside Electron')
    console.log(
      `Electron ${process.versions.electron}, ABI ${process.versions.modules}: ${appRoot}`,
    )

    // Storage must remain a real module: bundling conf into the application
    // lets its self-cache invalidation evict the application entrypoint.
    assert.equal(typeof load('electron-store'), 'function')
    console.log('PASS electron-store: isolated storage dependency loaded')

    const keymap = load('@packages/native-keymap')
    assert.ok(Object.keys(keymap.getKeyMap()).length > 0)
    assert.ok(keymap.getCurrentKeyboardLayout())
    console.log('PASS native-keymap: keyboard layout read')

    const { Window } = load('win-control')
    assert.equal(typeof Window.getForeground, 'function')
    Window.getForeground()
    console.log('PASS win-control: active window read')

    assert.equal(typeof load('forcefocus').focusWindow, 'function')
    console.log('PASS forcefocus: Electron ABI loaded')

    const overlay = load('@packages/electron-game-overlay')
    assert.equal(typeof overlay.start, 'function')
    for (const filename of [
      'injector_helper.exe',
      'injector_helper.x64.exe',
      'n_overlay.dll',
      'n_overlay.x64.dll',
    ]) {
      assert.ok(
        existsSync(
          path.join(
            path.dirname(resolvePackage('@packages/electron-game-overlay')),
            filename,
          ),
        ),
        `missing overlay binary: ${filename}`,
      )
    }
    console.log('PASS electron-game-overlay: native addon loaded')

    assert.ok(load('@nut-tree-fork/libnut-win32'))
    console.log('PASS libnut-win32: native addon loaded')

    const mouse = load('@packages/win-mouse')()
    mouse.destroy()
    console.log('PASS win-mouse: Win32 input tracker created and destroyed')

    const processInfo = await load('windows-tlist').getProcessInfo(process.pid)
    assert.ok(processInfo.threadCount > 0)
    console.log(
      'PASS windows-tlist: native executable queried the current process',
    )

    // The application uses a separate Node child for WMI. Initializing WMI in
    // Electron's main process conflicts with Chromium's COM security setup.
    await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          path.join(__dirname, 'native-watcher.cjs'),
          resolvePackage('wql-process-monitor'),
        ],
        {
          env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
          stdio: 'inherit',
          windowsHide: true,
        },
      )
      child.on('error', reject)
      child.on('exit', (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`WMI child exited with ${code}`)),
      )
    })

    clearTimeout(timeout)
    app.exit(0)
  })
  .catch((error) => {
    console.error(error)
    clearTimeout(timeout)
    app.exit(1)
  })
