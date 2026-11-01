// Runs only in a subprocess with an isolated path supplied by storage.test.mjs.
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const appRequire = createRequire(
  path.resolve(__dirname, '../../apps/app/package.json'),
)
const storeRequire = createRequire(appRequire.resolve('electron-store'))
const directory = path.resolve(process.argv[2])
const mode = process.argv[3]
const originalRename = fs.renameSync
fs.renameSync = function (from, to, ...args) {
  if (path.resolve(to) === path.join(directory, 'settings.json')) {
    if (mode === 'crash') {
      fs.writeFileSync(path.join(directory, 'at-commit'), 'ready')
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0)
    }
    throw Object.assign(Error('controlled storage failure'), { code: mode })
  }
  return originalRename.call(this, from, to, ...args)
}
const Conf = storeRequire('conf')
const store = new Conf({ cwd: directory, configName: 'settings' })
try {
  store.set('settings', {
    theme: 'light',
    dictionary: 'replacement'.repeat(100000),
  })
} catch (error) {
  if (error.code !== mode) throw error
  fs.writeFileSync(
    path.join(directory, 'failure.json'),
    JSON.stringify({ code: error.code }),
  )
}
