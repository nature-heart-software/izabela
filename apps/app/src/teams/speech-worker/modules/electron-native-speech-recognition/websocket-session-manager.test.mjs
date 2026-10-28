import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'

class Socket extends EventEmitter {
  static CONNECTING = 0
  static OPEN = 1
  readyState = 0
  closes = 0
  open() {
    this.readyState = 1
    this.emit('open')
  }
  close() {
    this.closes++
    this.readyState = 3
    this.emit('close')
  }
}
const flush = () => new Promise((resolve) => setImmediate(resolve))
function fixture(factory, options = {}) {
  let time = 0
  const timers = new Map()
  let serial = 0
  const schedule = (fn, delay, repeat = false) => {
    const id = ++serial
    timers.set(id, { fn, at: time + delay, delay, repeat })
    return id
  }
  const { WebSocketSessionManager } = loadTypescript(
    fileURLToPath(new URL('./websocket-session-manager.ts', import.meta.url)),
    { ws: { WebSocket: Socket } },
    {
      Date: { now: () => time },
      console: { error() {} },
      setTimeout: (fn, delay) => schedule(fn, delay),
      setInterval: (fn, delay) => schedule(fn, delay, true),
      clearTimeout: (id) => timers.delete(id),
      clearInterval: (id) => timers.delete(id),
    },
  )
  const manager = new WebSocketSessionManager({
    factory,
    sessionMaxAge: 300,
    connectionTimeout: 20,
    ...options,
  })
  return {
    manager,
    timers,
    async tick(ms) {
      time += ms
      for (const [id, timer] of [...timers])
        if (timer.at <= time) {
          if (timer.repeat) timer.at = time + timer.delay
          else timers.delete(id)
          timer.fn()
        }
      await flush()
    },
  }
}

test('failed initial connection can retry and simultaneous callers share one connection', async () => {
  let calls = 0
  const socket = new Socket()
  const f = fixture(async () => {
    if (++calls === 1) throw Error('offline')
    return socket
  })
  try {
    assert.equal(await f.manager.ready, null)
    const a = f.manager.getSession(),
      b = f.manager.getSession()
    await flush()
    socket.open()
    assert.equal((await a).socket, socket)
    assert.equal((await b).socket, socket)
    assert.equal(calls, 2)
  } finally {
    f.manager.stop()
  }
})

test('closed sockets are replaced, including factories returning an already open socket', async () => {
  const sockets = []
  const f = fixture(async () => {
    const s = new Socket()
    s.open()
    sockets.push(s)
    return s
  })
  try {
    await f.manager.ready
    sockets[0].close()
    assert.equal(f.manager.getActiveSession(), null)
    assert.equal((await f.manager.getSession()).socket, sockets[1])
  } finally {
    f.manager.stop()
  }
})

test('immediate cleanup never starts a connection factory', async () => {
  let calls = 0
  const f = fixture(async () => {
    calls++
    return new Socket()
  })
  f.manager.stop()
  assert.equal(await f.manager.ready, null)
  assert.equal(calls, 0)
  assert.equal(f.timers.size, 0)
})

test('stop settles pending startup and closes a factory result that arrives afterwards', async () => {
  let provide
  const f = fixture(
    () =>
      new Promise((resolve) => {
        provide = resolve
      }),
  )
  await flush()
  f.manager.stop()
  assert.equal(await f.manager.ready, null)
  const socket = new Socket()
  provide(socket)
  await flush()
  assert.equal(socket.closes, 1)
  assert.equal(await f.manager.getSession(), null)
  assert.equal(f.timers.size, 0)
})

test('timeout and close before open settle startup without leaving listeners or timers', async () => {
  for (const mode of ['timeout', 'close']) {
    const socket = new Socket()
    const f = fixture(async () => socket)
    try {
      await flush()
      if (mode === 'timeout') await f.tick(20)
      else socket.close()
      assert.equal(await f.manager.ready, null)
      assert.equal(socket.listenerCount('open'), 0)
      assert.equal(socket.listenerCount('close'), 0)
    } finally {
      f.manager.stop()
    }
    assert.equal(f.timers.size, 0)
  }
})

test('failed background renewal preserves the healthy overlapping session', async () => {
  let calls = 0
  const sockets = []
  const f = fixture(async () => {
    if (++calls > 2) throw Error('renewal outage')
    const socket = new Socket()
    socket.open()
    sockets.push(socket)
    return socket
  })
  try {
    await f.manager.ready
    await f.tick(150)
    await f.tick(150)
    assert.equal(f.manager.getActiveSession().socket, sockets[1])
    assert.equal(sockets[0].closes, 0)
    assert.equal(sockets[1].closes, 0)
  } finally {
    f.manager.stop()
  }
})
