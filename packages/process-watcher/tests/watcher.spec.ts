import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'

// Evaluate the actual child entrypoint without importing Windows native code or
// keeping the test process alive. Expose its existing promise for error checks.
function boot(load?: () => Promise<unknown>) {
  const monitor = new EventEmitter()
  const subscribe = vi.fn(async (_options: unknown) => monitor)
  const send = vi.fn()
  const interval = vi.fn()
  const source = readFileSync(new URL('../index.js', import.meta.url), 'utf8')
    .replace("import('wql-process-monitor')", 'load()')
    .replace('wqlImport\n  .then', 'const completion = wqlImport\n  .then')
  const completion = new Function(
    'load',
    'process',
    'setInterval',
    `${source}\nreturn completion`,
  )(
    load ?? (() => Promise.resolve({ subscribe })),
    { send },
    interval,
  ) as Promise<void>
  return { monitor, subscribe, send, interval, completion }
}

describe('process watcher child entrypoint', () => {
  it('subscribes once to both native change streams with the executable exclusions', async () => {
    const child = boot()
    await child.completion
    expect(child.subscribe).toHaveBeenCalledExactlyOnceWith({
      creation: true,
      deletion: true,
      bin: { filter: ['cmd.exe', 'tlist.exe', 'conhost.exe'] },
    })
    expect(child.monitor.listenerCount('creation')).toBe(1)
    expect(child.monitor.listenerCount('deletion')).toBe(1)
    expect(child.send).not.toHaveBeenCalled()
  })
  it('installs the hourly keepalive before asynchronous native initialization', async () => {
    let resolve!: (value: { subscribe: () => Promise<EventEmitter> }) => void
    const pending = new Promise<{ subscribe: () => Promise<EventEmitter> }>(
      (done) => {
        resolve = done
      },
    )
    const child = boot(() => pending as never)
    expect(child.interval).toHaveBeenCalledExactlyOnceWith(
      expect.any(Function),
      3600000,
    )
    expect(child.interval.mock.calls[0][0]()).toBeUndefined()
    expect(child.send).not.toHaveBeenCalled()
    resolve({ subscribe: async () => child.monitor })
    await child.completion
    expect(child.monitor.listenerCount('creation')).toBe(1)
  })
  it('forwards ordered creation and deletion payloads without deduplication', async () => {
    const child = boot()
    await child.completion
    const payload = ['editor.exe', 42, 'C:\\editor.exe', 'user']
    child.monitor.emit('creation', payload)
    child.monitor.emit('creation', payload)
    child.monitor.emit('deletion', payload)
    expect(child.send.mock.calls).toEqual([
      [
        {
          type: 'process-creation',
          payload: {
            process: 'editor.exe',
            pid: 42,
            filepath: 'C:\\editor.exe',
            user: 'user',
          },
        },
      ],
      [
        {
          type: 'process-creation',
          payload: {
            process: 'editor.exe',
            pid: 42,
            filepath: 'C:\\editor.exe',
            user: 'user',
          },
        },
      ],
      [
        {
          type: 'process-deletion',
          payload: {
            process: 'editor.exe',
            pid: 42,
            filepath: 'C:\\editor.exe',
            user: 'user',
          },
        },
      ],
    ])
  })
  it('preserves missing tuple fields and ignores extra native fields', async () => {
    const child = boot()
    await child.completion
    child.monitor.emit('creation', ['x'])
    child.monitor.emit('deletion', ['x', 0, '', null, 'ignored'])
    expect(child.send.mock.calls).toEqual([
      [
        {
          type: 'process-creation',
          payload: {
            process: 'x',
            pid: undefined,
            filepath: undefined,
            user: undefined,
          },
        },
      ],
      [
        {
          type: 'process-deletion',
          payload: { process: 'x', pid: 0, filepath: '', user: null },
        },
      ],
    ])
  })
  it('propagates IPC send errors synchronously from native event callbacks', async () => {
    const child = boot()
    await child.completion
    const error = new Error('IPC disconnected')
    child.send.mockImplementation(() => {
      throw error
    })
    expect(() => child.monitor.emit('creation', ['x', 1])).toThrow(error)
  })
  it('rejects native import failures without sending an error packet or clearing keepalive', async () => {
    const error = new Error('unsupported platform')
    const child = boot(() => Promise.reject(error))
    await expect(child.completion).rejects.toBe(error)
    expect(child.send).not.toHaveBeenCalled()
    expect(child.interval).toHaveBeenCalledTimes(1)
    expect(child.monitor.eventNames()).toEqual([])
  })
  it('rejects subscribe failures and installs no event listeners', async () => {
    const error = new Error('WMI unavailable')
    const subscribe = vi.fn().mockRejectedValue(error)
    const child = boot(() => Promise.resolve({ subscribe }))
    await expect(child.completion).rejects.toBe(error)
    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(child.monitor.eventNames()).toEqual([])
    expect(child.send).not.toHaveBeenCalled()
  })
  it('waits for subscribe completion before installing listeners', async () => {
    let resolve!: (monitor: EventEmitter) => void
    const pending = new Promise<EventEmitter>((done) => {
      resolve = done
    })
    const child = boot(() => Promise.resolve({ subscribe: () => pending }))
    await Promise.resolve()
    expect(child.monitor.eventNames()).toEqual([])
    child.monitor.emit('creation', ['before', 1])
    resolve(child.monitor)
    await child.completion
    child.monitor.emit('deletion', ['after', 2])
    expect(child.send).toHaveBeenCalledExactlyOnceWith({
      type: 'process-deletion',
      payload: {
        process: 'after',
        pid: 2,
        filepath: undefined,
        user: undefined,
      },
    })
  })
  it('leaves native error events unhandled rather than converting them to IPC', async () => {
    const child = boot()
    await child.completion
    const error = new Error('native stream failure')
    expect(() => child.monitor.emit('error', error)).toThrow(error)
    expect(child.send).not.toHaveBeenCalled()
  })
  it('propagates deletion callback IPC errors too', async () => {
    const child = boot()
    await child.completion
    const error = new Error('parent closed')
    child.send.mockImplementation(() => {
      throw error
    })
    expect(() => child.monitor.emit('deletion', ['x', 1])).toThrow(error)
  })
  it.fails(
    '[known issue] reports native initialization failures to the IPC parent',
    async () => {
      const child = boot(() => Promise.reject(new Error('WMI unavailable')))
      await child.completion.catch(() => {})
      expect(child.send).toHaveBeenCalledWith({
        type: 'process-error',
        payload: 'WMI unavailable',
      })
    },
  )
})
