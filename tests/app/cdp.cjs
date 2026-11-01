const { once } = require('node:events')
const { createRequire } = require('node:module')
const path = require('node:path')
const WebSocket = createRequire(
  path.resolve(__dirname, '../../apps/app/package.json'),
)('ws')
async function connect(url, timeout = 45000) {
  const deadline = Date.now() + timeout
  let target
  while (Date.now() < deadline) {
    try {
      target = (await (await fetch(url)).json())[0]
    } catch {}
    if (target?.webSocketDebuggerUrl) break
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  if (!target) throw Error('Debugger unavailable: ' + url)
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await once(socket, 'open')
  let id = 0
  const pending = new Map()
  socket.on('message', (data) => {
    const message = JSON.parse(data.toString())
    pending.get(message.id)?.(message)
  })
  return {
    close: () => socket.close(),
    async evaluate(expression, timeout = 60000) {
      const request = ++id
      let timer
      try {
        const response = new Promise((resolve, reject) => {
          pending.set(request, resolve)
          timer = setTimeout(
            () => reject(Error('Debugger evaluation timed out')),
            timeout,
          )
        })
        socket.send(
          JSON.stringify({
            id: request,
            method: 'Runtime.evaluate',
            params: { expression, returnByValue: true, awaitPromise: true },
          }),
        )
        const message = await response
        if (message.error || message.result?.exceptionDetails)
          throw Error(
            JSON.stringify(message.error || message.result.exceptionDetails),
          )
        return message.result.result.value
      } finally {
        clearTimeout(timer)
        pending.delete(request)
      }
    },
  }
}
module.exports = { connect }
