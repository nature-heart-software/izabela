import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const electron = vi.hoisted(() => ({
  ipcMain: { handle: vi.fn() },
  ipcRenderer: { invoke: vi.fn() },
  contextBridge: { exposeInMainWorld: vi.fn() },
}))
vi.mock('electron', () => electron)

let transport: EventEmitter
let exposed: Map<string, Record<string, (...args: any[]) => Promise<unknown>>>
const ipcEvent = { sender: { id: 42 } }

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('window', undefined)
  transport = new EventEmitter()
  exposed = new Map()
  electron.ipcMain.handle.mockImplementation((channel, handler) => {
    if (transport.listenerCount(channel))
      throw new Error(`Duplicate handler: ${channel}`)
    transport.on(channel, (args, resolve, reject) => {
      try {
        Promise.resolve(handler(ipcEvent, ...args)).then(resolve, reject)
      } catch (error) {
        reject(error)
      }
    })
  })
  electron.ipcRenderer.invoke.mockImplementation(
    (channel, ...args) =>
      new Promise((resolve, reject) => {
        if (!transport.emit(channel, args, resolve, reject))
          reject(new Error(`Missing handler: ${channel}`))
      }),
  )
  electron.contextBridge.exposeInMainWorld.mockImplementation((name, api) => {
    if (exposed.has(name)) throw new Error(`Duplicate exposure: ${name}`)
    exposed.set(name, api)
  })
})

afterEach(() => {
  transport.removeAllListeners()
  vi.unstubAllGlobals()
})

async function loadRenderer() {
  vi.stubGlobal('window', {})
  vi.resetModules()
  return import('../src/main')
}

describe('main process registration', () => {
  it('detects the main process and keeps the public main cache empty', async () => {
    const { Bridge, bridge, isRenderer } = await import('../src/main')
    expect(isRenderer).toBe(false)
    const local = Bridge()
    local.register([
      ['calculator', () => ({ add: (a: number, b: number) => a + b })],
    ])
    expect(transport.eventNames()).toEqual(['calculator-add'])
    expect(local.registeredInstances).toEqual({})
    expect(bridge.registeredInstances).toEqual({})
    expect(electron.contextBridge.exposeInMainWorld).not.toHaveBeenCalled()
  })

  it('registers only own enumerable functions, not fields or inherited methods', async () => {
    const { Bridge } = await import('../src/main')
    const instance = Object.assign(Object.create({ inherited: () => 'no' }), {
      value: 2,
      own: () => 'yes',
    })
    Object.defineProperty(instance, 'hidden', {
      value: () => 'no',
      enumerable: false,
    })
    Bridge().register([['service', () => instance]])
    expect(transport.eventNames()).toEqual(['service-own'])
    await expect(electron.ipcRenderer.invoke('service-own')).resolves.toBe(
      'yes',
    )
  })

  it('runs factories exactly once per registration and returns void', async () => {
    const { Bridge } = await import('../src/main')
    const factory = vi.fn(() => ({ ping: () => 'pong' }))
    expect(Bridge().register([['service', factory]])).toBeUndefined()
    expect(factory).toHaveBeenCalledExactlyOnceWith()
    expect(electron.ipcMain.handle).toHaveBeenCalledTimes(1)
  })

  it('removes the IPC event and retains method receiver state', async () => {
    const { Bridge } = await import('../src/main')
    const instance = {
      total: 10,
      add(amount: number) {
        this.total += amount
        return this.total
      },
    }
    Bridge().register([['counter', () => instance]])
    await expect(electron.ipcRenderer.invoke('counter-add', 4)).resolves.toBe(
      14,
    )
    await expect(electron.ipcRenderer.invoke('counter-add', -2)).resolves.toBe(
      12,
    )
    expect(instance.total).toBe(12)
  })

  it('preserves synchronous, asynchronous and undefined results', async () => {
    const { Bridge } = await import('../src/main')
    Bridge().register([
      [
        'values',
        () => ({
          sync: (value: unknown) => value,
          async: async (value: unknown) => ({ value }),
          nothing: () => undefined,
        }),
      ],
    ])
    const payload = { nested: [false, null, 0, ''] }
    await expect(
      electron.ipcRenderer.invoke('values-sync', payload),
    ).resolves.toBe(payload)
    await expect(
      electron.ipcRenderer.invoke('values-async', payload),
    ).resolves.toEqual({ value: payload })
    await expect(
      electron.ipcRenderer.invoke('values-nothing'),
    ).resolves.toBeUndefined()
  })

  it.each(['sync', 'async'] as const)(
    'propagates %s method failures',
    async (mode) => {
      const { Bridge } = await import('../src/main')
      const error = new Error(`${mode} failed`)
      Bridge().register([
        [
          'service',
          () => ({
            fail:
              mode === 'sync'
                ? () => {
                    throw error
                  }
                : async () => {
                    throw error
                  },
          }),
        ],
      ])
      await expect(electron.ipcRenderer.invoke('service-fail')).rejects.toBe(
        error,
      )
    },
  )

  it('isolates method names across plugin namespaces', async () => {
    const { bridge } = await import('../src/main')
    bridge.register([
      ['one', () => ({ read: () => 1 })],
      ['two', () => ({ read: () => 2 })],
    ])
    await expect(electron.ipcRenderer.invoke('one-read')).resolves.toBe(1)
    await expect(electron.ipcRenderer.invoke('two-read')).resolves.toBe(2)
  })

  it('propagates registration errors and does not process later plugins', async () => {
    const { Bridge } = await import('../src/main')
    const later = vi.fn(() => ({ read: () => 2 }))
    const error = new Error('factory failed')
    expect(() =>
      Bridge().register([
        [
          'bad',
          () => {
            throw error
          },
        ],
        ['later', later],
      ]),
    ).toThrow(error)
    expect(later).not.toHaveBeenCalled()
    expect(transport.eventNames()).toEqual([])
  })

  it('surfaces Electron duplicate-channel errors without silently replacing the handler', async () => {
    const { Bridge } = await import('../src/main')
    const api = Bridge()
    api.register([['service', () => ({ read: () => 'original' })]])
    expect(() =>
      api.register([['service', () => ({ read: () => 'replacement' })]]),
    ).toThrow('Duplicate handler: service-read')
    await expect(electron.ipcRenderer.invoke('service-read')).resolves.toBe(
      'original',
    )
  })
})

describe('renderer exposure and end-to-end wrapper transport', () => {
  it('exposes only proxies and forwards arguments to the real main wrapper', async () => {
    const main = await import('../src/main')
    const mainFactory = vi.fn(() => ({
      add: (a: number, b: number) => a + b,
      label: 'main',
    }))
    main.bridge.register([['calculator', mainFactory]])
    const renderer = await loadRenderer()
    const localAdd = vi.fn(() => -100)
    const rendererFactory = vi.fn(() => ({ add: localAdd, label: 'renderer' }))
    renderer.bridge.register([['calculator', rendererFactory]])
    expect(renderer.isRenderer).toBe(true)
    expect(rendererFactory).toHaveBeenCalledExactlyOnceWith()
    expect(Object.keys(exposed.get('calculator')!)).toEqual(['add'])
    expect(renderer.bridge.registeredInstances.calculator.add).toBe(
      exposed.get('calculator')!.add,
    )
    await expect(exposed.get('calculator')!.add(7, 8)).resolves.toBe(15)
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledExactlyOnceWith(
      'calculator-add',
      7,
      8,
    )
    expect(localAdd).not.toHaveBeenCalled()
    expect(electron.ipcMain.handle).toHaveBeenCalledTimes(1)
  })

  it('forwards a rejection from the main wrapper through the renderer proxy', async () => {
    const main = await import('../src/main')
    const error = new Error('operation failed')
    main.bridge.register([
      [
        'service',
        () => ({
          read: async () => {
            throw error
          },
        }),
      ],
    ])
    const renderer = await loadRenderer()
    renderer.bridge.register([
      ['service', () => ({ read: () => 'not called' })],
    ])
    await expect(exposed.get('service')!.read()).rejects.toBe(error)
  })

  it('surfaces missing main handlers as rejected proxy calls', async () => {
    const { bridge } = await loadRenderer()
    bridge.register([['missing', () => ({ read: () => 1 })]])
    await expect(exposed.get('missing')!.read()).rejects.toThrow(
      'Missing handler: missing-read',
    )
  })

  it('keeps separate Bridge instances independent and exposes a copy of each method table', async () => {
    const { Bridge } = await loadRenderer()
    const one = Bridge()
    const two = Bridge()
    one.register([['one', () => ({ read: () => 1 })]])
    two.register([['two', () => ({ read: () => 2 })]])
    expect(Object.keys(one.registeredInstances)).toEqual(['one'])
    expect(Object.keys(two.registeredInstances)).toEqual(['two'])
    expect(exposed.get('one')).not.toBe(one.registeredInstances.one)
    expect(exposed.get('one')!.read).toBe(one.registeredInstances.one.read)
  })

  it('exposes an empty object for a plugin with no own functions', async () => {
    const { bridge } = await loadRenderer()
    bridge.register([['settings', () => ({ enabled: true })]])
    expect(exposed.get('settings')).toEqual({})
    expect(electron.ipcRenderer.invoke).not.toHaveBeenCalled()
    expect(electron.ipcMain.handle).not.toHaveBeenCalled()
  })

  it('propagates contextBridge duplicate-exposure errors', async () => {
    const { bridge } = await loadRenderer()
    bridge.register([['service', () => ({ read: () => 1 })]])
    const original = bridge.registeredInstances.service.read
    expect(() =>
      bridge.register([['service', () => ({ read: () => 2 })]]),
    ).toThrow('Duplicate exposure: service')
    expect(bridge.registeredInstances.service.read).toBe(original)
  })
})
