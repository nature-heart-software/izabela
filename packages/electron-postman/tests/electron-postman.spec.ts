import { EventEmitter } from 'node:events'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sourceLoader } from '../../electron-pinia/tests/source-loader'

const root = resolve('packages/electron-postman')

function network() {
  const ipcMain = new EventEmitter() as any
  const handlers = new Map<string, Function>()
  ipcMain.handle = (channel: string, listener: Function) => {
    if (typeof listener !== 'function')
      throw new TypeError('listener must be a function')
    if (handlers.has(channel)) throw new Error('handler already registered')
    handlers.set(channel, listener)
  }
  ipcMain.handleOnce = (channel: string, listener: Function) => {
    if (typeof listener !== 'function')
      throw new TypeError('listener must be a function')
    ipcMain.handle(channel, (...args: any[]) => {
      handlers.delete(channel)
      return listener(...args)
    })
  }
  ipcMain.removeHandler = (channel: string) => handlers.delete(channel)
  const contents = new Map<number, any>()
  const queue: (() => void)[] = []
  const errors: unknown[] = []
  const wire: any[] = []
  let random = 0.1
  const math = Object.create(Math)
  math.random = () => (random += 0.001)
  const electron: any = {
    ipcMain,
    webContents: { fromId: (id: number) => contents.get(id) },
  }
  const load = sourceLoader(
    { electron },
    { process: { type: 'browser' }, Math: math },
  )
  const main = load(`${root}/index.js`).ipcMain
  const utils = load(`${root}/src/utils.js`)
  function renderer(name: string, id: number, finish = true) {
    const events = new EventEmitter()
    const wc = new EventEmitter() as any
    let destroyed = false
    wc.id = id
    wc.isDestroyed = () => destroyed
    wc.send = (channel: string, ...args: any[]) => {
      const data = structuredClone(args)
      wire.push({ to: id, channel, args: data })
      queue.push(() => events.emit(channel, { senderId: 0 }, ...data))
    }
    contents.set(id, wc)
    const window = new EventEmitter() as any
    window.webContents = wc
    const native = {
      on: (channel: string, fn: (...args: any[]) => void) =>
        events.on(channel, fn),
      once: (channel: string, fn: (...args: any[]) => void) =>
        events.once(channel, fn),
      removeAllListeners: (channel: string) =>
        events.removeAllListeners(channel),
      send: (channel: string, ...args: any[]) => {
        const data = structuredClone(args)
        wire.push({ from: id, channel, args: data })
        queue.push(() => ipcMain.emit(channel, { sender: wc }, ...data))
      },
      invoke: async (channel: string, ...args: any[]) => {
        const fn = handlers.get(channel)
        if (!fn) throw new Error(`No handler for ${channel}`)
        return fn({ sender: wc }, ...structuredClone(args))
      },
    }
    const exposed: Record<string, any> = {}
    const api = sourceLoader(
      {
        electron: {
          ipcRenderer: native,
          contextBridge: {
            exposeInMainWorld: (key: string, value: any) => {
              exposed[key] = value
            },
          },
        },
      },
      { process: { type: 'renderer' }, Math: math },
    )(`${root}/index.js`).ipcRenderer
    main.registerBrowserWindow(name, window)
    if (finish) wc.emit('did-finish-load')
    return {
      api,
      native,
      events,
      wc,
      window,
      exposed,
      close: () => {
        destroyed = true
        window.emit('closed')
      },
    }
  }
  async function flush() {
    for (let iteration = 0; iteration < 10; iteration++) {
      while (queue.length) {
        try {
          queue.shift()!()
        } catch (error) {
          errors.push(error)
        }
      }
      await Promise.resolve()
    }
  }
  return {
    main,
    renderer,
    ipcMain,
    handlers,
    contents,
    utils,
    wire,
    errors,
    flush,
  }
}

describe('electron-postman real CommonJS entry and IPC', () => {
  it('selects browser/renderer public APIs and rejects non-Electron processes', () => {
    const n = network()
    expect(Object.keys(n.main)).toEqual([
      'registerBrowserWindow',
      'sendTo',
      'on',
      'once',
      'invokeTo',
      'handle',
      'handleOnce',
      'removeAllListeners',
      'removeHandler',
    ])
    const r = n.renderer('a', 1)
    expect(r.api.sendTo).toBeTypeOf('function')
    expect(() =>
      sourceLoader({}, { process: { type: 'worker' } })(`${root}/index.js`),
    ).toThrow(
      'grapes-ipc works only in Electron main and renderer process. Process type worker is not supported',
    )
  })

  it('registers only after load, announces peers, and routes messages in all directions', async () => {
    const n = network()
    const a = n.renderer('a', 1, false)
    expect(() => n.main.sendTo('a', 'message')).toThrow(
      "Process 'a' is not registered",
    )
    a.wc.emit('did-finish-load')
    const b = n.renderer('b', 2)
    await n.flush()
    const seen: any[] = []
    a.api.on('main', 'message', (...args: any[]) =>
      seen.push(['main-a', ...args]),
    )
    b.api.on('a', 'message', (...args: any[]) => seen.push(['a-b', ...args]))
    a.api.on('b', 'message', (...args: any[]) => seen.push(['b-a', ...args]))
    n.main.on('a', 'message', (...args: any[]) =>
      seen.push(['a-main', ...args]),
    )
    n.main.sendTo('a', 'message', { value: 1 }, null)
    a.api.sendTo('b', 'message', 2, 'two')
    b.api.sendTo('a', 'message', 3)
    a.api.sendTo('main', 'message', 4)
    a.api.send('message', 5)
    await n.flush()
    expect(seen).toEqual([
      ['main-a', { value: 1 }, null],
      ['a-main', 4],
      ['a-main', 5],
      ['a-b', 2, 'two'],
      ['b-a', 3],
    ])
    expect(n.errors).toEqual([])
  })

  it('rejects reserved names, duplicate names and duplicate webContents after registration', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    await n.flush()
    expect(() => n.main.registerBrowserWindow('main', a.window)).toThrow(
      "Window name 'main' is reserved for main process",
    )
    expect(() => n.main.registerBrowserWindow('a', a.window)).toThrow(
      "Either window name 'a' or window ID 1 is already assigned",
    )
    expect(() => n.main.registerBrowserWindow('other', a.window)).toThrow(
      'already assigned',
    )
  })

  it('removes closed windows from routing and announces removal to remaining peers', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    const b = n.renderer('b', 2)
    await n.flush()
    b.close()
    await n.flush()
    expect(() => n.main.sendTo('b', 'msg')).toThrow(
      "Process 'b' is not registered",
    )
    expect(() => a.api.sendTo('b', 'msg')).toThrow(
      "Process 'b' is not registered",
    )
    expect(
      n.wire.some(
        (m) =>
          m.to === 1 &&
          m.channel === 'announce-window-id' &&
          m.args[0] === 'b' &&
          m.args[1] === undefined,
      ),
    ).toBe(true)
  })

  it('drops relays to missing and destroyed webContents without delivering', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    const b = n.renderer('b', 2)
    await n.flush()
    const seen: any[] = []
    b.api.on('a', 'msg', (...args: any[]) => seen.push(args))
    a.api.sendTo('b', 'msg', 'stale')
    b.close()
    a.native.send('relay-message', 999, 'channel', 'missing')
    await n.flush()
    expect(seen).toEqual([])
    expect(n.errors).toEqual([])
  })

  it('supports once listeners and channel-specific removal without exposing native event objects', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    await n.flush()
    const seen: any[] = []
    n.main.once('a', 'once', (...args: any[]) => seen.push(['main', ...args]))
    a.api.once('main', 'once', (...args: any[]) =>
      seen.push(['renderer', ...args]),
    )
    n.main.on('a', 'removed', () => {
      throw new Error('removed main listener')
    })
    a.api.on('main', 'removed', () => {
      throw new Error('removed renderer listener')
    })
    n.main.removeAllListeners('a', 'removed')
    a.api.removeAllListeners('main', 'removed')
    for (let i = 0; i < 2; i++) {
      a.api.send('once', i)
      n.main.sendTo('a', 'once', i)
    }
    a.api.send('removed')
    n.main.sendTo('a', 'removed')
    await n.flush()
    expect(seen).toEqual([
      ['main', 0],
      ['renderer', 0],
    ])
    expect(n.errors).toEqual([])
  })

  it('awaits main invoke handlers, propagates errors and honors handler removal', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    await n.flush()
    n.main.handle('a', 'square', async (value: number) => value * value)
    expect(await a.api.invoke('square', 4)).toBe(16)
    expect(await a.api.invokeTo('main', 'square', 5)).toBe(25)
    n.main.handle('a', 'error', () => {
      throw new Error('handler failed')
    })
    await expect(a.api.invoke('error')).rejects.toThrow('handler failed')
    n.main.removeHandler('a', 'square')
    await expect(a.api.invoke('square', 2)).rejects.toThrow(
      'No handler for electron-postman-a-square',
    )
    n.main.handle('a', 'ignored', null)
    expect(n.handlers.has('electron-postman-a-ignored')).toBe(false)
  })

  it('correlates concurrent main-to-renderer replies and removes response listeners', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    await n.flush()
    a.api.handle('main', 'double', (n: number) => n * 2)
    const first = n.main.invokeTo('a', 'double', 3)
    const second = n.main.invokeTo('a', 'double', 7)
    await n.flush()
    expect(await Promise.all([first, second])).toEqual([6, 14])
    expect(
      n.ipcMain
        .eventNames()
        .filter((name: any) => /^electron-postman-\d+-a-double$/.test(name)),
    ).toEqual([])
    const requests = n.wire.filter(
      (m) => m.to === 1 && m.channel === 'electron-postman-main-double',
    )
    expect(requests).toHaveLength(2)
    expect(requests[0].args[0]).not.toBe(requests[1].args[0])
  })

  it('consumes renderer handleOnce exactly once', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    await n.flush()
    a.api.handleOnce('main', 'one', (value: number) => value + 1)
    const reply = n.main.invokeTo('a', 'one', 8)
    await n.flush()
    expect(await reply).toBe(9)
    expect(a.events.listenerCount('electron-postman-main-one')).toBe(0)
    n.main.sendTo('a', 'one', 1, 9)
    await n.flush()
    expect(n.errors).toEqual([])
  })

  it('exposes the actual bounded renderer API through contextBridge with default and custom keys', () => {
    const n = network()
    const a = n.renderer('a', 1)
    a.api.exposeInMainWorld()
    a.api.exposeInMainWorld('ipc')
    expect(Object.keys(a.exposed.ipc)).toEqual([
      'sendTo',
      'send',
      'on',
      'once',
      'invokeTo',
      'invoke',
      'handle',
      'handleOnce',
      'removeAllListeners',
    ])
    expect(a.exposed.ipc.send).toBe(a.api.send)
    expect(a.exposed.ipcRenderer).toBe(a.exposed.ipc)
    expect(a.exposed.ipc.exposeInMainWorld).toBeUndefined()
    expect(a.exposed.ipc.removeHandler).toBeUndefined()
  })

  it('characterizes main handleOnce passing no listener to Electron and throwing', () => {
    const n = network()
    expect(() => n.main.handleOnce('a', 'once', () => 4)).toThrow(
      'listener must be a function',
    )
    expect(n.handlers.size).toBe(0)
  })

  it.fails(
    '[known issue] main handleOnce should register a valid one-shot handler',
    () => {
      const n = network()
      expect(() => n.main.handleOnce('a', 'once', () => 4)).not.toThrow()
    },
  )

  it('characterizes peer invokes replying to main instead of the requesting renderer', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    const b = n.renderer('b', 2)
    await n.flush()
    b.api.handle('a', 'double', (value: number) => value * 2)
    let result: unknown
    a.api.invokeTo('b', 'double', 5).then((value: unknown) => {
      result = value
    })
    await n.flush()
    expect(result).toBeUndefined()
    expect(a.events.listenerCount('electron-postman-101000-b-double')).toBe(1)
    expect(n.wire.filter((m) => m.from === 2).at(-1)).toEqual({
      from: 2,
      channel: 'electron-postman-101000-b-double',
      args: [10],
    })
    expect(n.errors).toEqual([])
  })

  it.fails(
    '[known issue] peer invokes should resolve at the requesting renderer',
    async () => {
      const n = network()
      const a = n.renderer('a', 1)
      const b = n.renderer('b', 2)
      await n.flush()
      b.api.handle('a', 'double', (value: number) => value * 2)
      let result: unknown
      a.api.invokeTo('b', 'double', 5).then((value: unknown) => {
        result = value
      })
      await n.flush()
      expect(result).toBe(10)
    },
  )

  it('characterizes async renderer handlers trying to send uncloneable promises', async () => {
    const n = network()
    const a = n.renderer('a', 1)
    await n.flush()
    a.api.handle('main', 'async', async () => 42)
    let result: unknown
    n.main.invokeTo('a', 'async').then((value: unknown) => {
      result = value
    })
    await n.flush()
    expect(result).toBeUndefined()
    expect(n.errors).toHaveLength(1)
    expect((n.errors[0] as Error).name).toBe('DataCloneError')
    expect(n.ipcMain.listenerCount('electron-postman-101000-a-async')).toBe(1)
  })

  it.fails(
    '[known issue] async renderer handlers should await results before replying',
    async () => {
      const n = network()
      const a = n.renderer('a', 1)
      await n.flush()
      a.api.handle('main', 'async', async () => 42)
      let result: unknown
      n.main.invokeTo('a', 'async').then((value: unknown) => {
        result = value
      })
      await n.flush()
      expect(result).toBe(42)
    },
  )

  it('characterizes failed invokes retaining their response listeners', async () => {
    const n = network()
    await expect(n.main.invokeTo('missing', 'call')).rejects.toThrow(
      "Process 'missing' is not registered",
    )
    expect(
      n.ipcMain.listenerCount('electron-postman-101000-missing-call'),
    ).toBe(1)
  })

  it.fails(
    '[known issue] failed invokes should remove their response listeners',
    async () => {
      const n = network()
      await n.main.invokeTo('missing', 'call').catch(() => {})
      expect(
        n.ipcMain.listenerCount('electron-postman-101000-missing-call'),
      ).toBe(0)
    },
  )

  it('preserves prefix/token formatting and bounded integer token generation', () => {
    const n = network()
    expect(n.utils.prefixed('a', 'msg')).toBe('electron-postman-a-msg')
    expect(n.utils.prefixed('a', 'msg', 12)).toBe('electron-postman-12-a-msg')
    expect(n.utils.prefixed('a', 'msg', 0)).toBe('electron-postman-a-msg')
    expect(n.utils.getToken()).toBe(101000)
  })
})
