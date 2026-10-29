const { pathToFileURL } = require('node:url')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const light = process.argv[3] === '--light'

;(light
  ? Promise.resolve(require(process.argv[2]))
  : import(pathToFileURL(process.argv[2]).href)
)
  .then(async (watcher) => {
    const monitor = await watcher.subscribe({
      creation: true,
      deletion: true,
      bin: { filter: ['cmd.exe', 'tlist.exe', 'conhost.exe'] },
    })
    if (light) {
      await new Promise((resolve, reject) => {
        let created = false,
          deleted = false
        const child = spawn('ping.exe', ['-n', '3', '127.0.0.1'], {
          windowsHide: true,
          stdio: 'ignore',
        })
        const timer = setTimeout(() => {
          child.kill()
          reject(new Error('Native watcher missed process events'))
        }, 12000)
        child.once('error', (error) => {
          clearTimeout(timer)
          reject(error)
        })
        for (const event of ['creation', 'deletion'])
          monitor.on(event, ([name, pid, filepath]) => {
            if (pid !== child.pid) return
            assert.match(name, /ping\.exe/i)
            assert.equal(typeof filepath, 'string')
            if (event === 'creation') created = true
            else deleted = true
            if (created && deleted) {
              clearTimeout(timer)
              resolve()
            }
          })
      })
      await monitor.close()
      console.log(
        'PASS process-watcher: lightweight DLL binding received creation/deletion and stopped',
      )
    } else {
      await watcher.closeEventSink()
      console.log(
        'PASS wql-process-monitor: DLL loaded and subscription stopped',
      )
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
