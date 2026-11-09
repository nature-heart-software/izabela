// Install the existing isolated test boundary before a real packaged main runs.
// Node's debugger is loopback-only and is disconnected before graphics testing.
const path = require('node:path')

function instrumentPackaged(child, config, configFile) {
  return new Promise((resolve, reject) => {
    let output = '',
      started = false
    const fail = (error) => {
      cleanup()
      reject(error)
    }
    const exited = () =>
      fail(new Error('Packaged app exited before test setup'))
    function cleanup() {
      child.stderr.off('data', inspect)
      child.off('exit', exited)
      child.off('error', fail)
    }
    function inspect(chunk) {
      output = (output + chunk.toString()).slice(-8192)
      const match = /ws:\/\/127\.0\.0\.1:\d+\/[-a-z0-9]+/i.exec(output)
      if (!match || started) return
      started = true
      boot(match[0]).then(() => {
        cleanup()
        resolve()
      }, fail)
    }
    async function boot(url) {
      const socket = new WebSocket(url)
      try {
        await new Promise((yes, no) => {
          socket.addEventListener('open', yes, { once: true })
          socket.addEventListener('error', no, { once: true })
        })
        let sequence = 0,
          onPause
        const pending = new Map(),
          paused = new Promise((yes) => {
            onPause = yes
          })
        socket.addEventListener('message', (event) => {
          const message = JSON.parse(String(event.data))
          if (message.id) {
            const request = pending.get(message.id)
            if (!request) return
            pending.delete(message.id)
            if (message.error)
              request.reject(new Error(JSON.stringify(message.error)))
            else request.resolve(message.result)
          } else if (message.method === 'Debugger.paused')
            onPause(message.params)
        })
        const send = (method, params = {}) =>
          new Promise((yes, no) => {
            const id = ++sequence
            pending.set(id, { resolve: yes, reject: no })
            socket.send(JSON.stringify({ id, method, params }))
          })
        await send('Runtime.enable')
        await send('Debugger.enable')
        await send('Runtime.runIfWaitingForDebugger')
        const pause = await paused
        const runtime = path.join(__dirname, 'runtime.cjs')
        const result = await send('Debugger.evaluateOnCallFrame', {
          callFrameId: pause.callFrames[0].callFrameId,
          expression:
            'process.argv=' +
            JSON.stringify([config.appExecutable, runtime, configFile]) +
            ';require(' +
            JSON.stringify(runtime) +
            ');true',
          returnByValue: true,
        })
        if (result.exceptionDetails)
          throw new Error(
            result.exceptionDetails.exception?.description ||
              result.exceptionDetails.text,
          )
        await send('Debugger.resume')
      } finally {
        socket.close()
      }
    }
    child.stderr.on('data', inspect)
    child.once('exit', exited)
    child.once('error', fail)
  })
}
module.exports = { instrumentPackaged }
