import { EventEmitter } from 'node:events'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import * as pinia from 'pinia'
import { createApp, nextTick, isReactive } from 'vue'
import { sourceLoader } from './source-loader'

const root = resolve('packages/electron-pinia/src')
const dispose: (() => void)[] = []
afterEach(() => {
  dispose
    .splice(0)
    .reverse()
    .forEach((fn) => fn())
})

function transport() {
  const ipc = new EventEmitter() as EventEmitter & {
    handle: (name: string, handler: Function) => void
  }
  const handlers = new Map<string, Function>()
  ipc.handle = (name, handler) => {
    if (handlers.has(name)) throw new Error(`Duplicate handler: ${name}`)
    handlers.set(name, handler)
  }
  const storage = new Map<string, any>()
  const constructed: any[] = []
  let getError: unknown
  class Storage {
    constructor(options: any) {
      constructed.push(options)
    }
    get(name: string) {
      if (getError) return Promise.reject(getError)
      return storage.get(name)
    }
    set(name: string, state: any) {
      storage.set(name, structuredClone(state))
    }
    delete(name: string) {
      storage.delete(name)
    }
  }
  const toolboxLoader = sourceLoader({})
  const toolbox = {
    ...toolboxLoader(resolve('packages/toolbox/src/utils/promise.ts')),
    ...toolboxLoader(resolve('packages/toolbox/src/utils/object.ts')),
  }
  const load = (
    globals = {},
    electron: any = {
      ipcMain: ipc,
      app: {
        getPath() {
          throw new Error('No filesystem defaults')
        },
      },
    },
  ) =>
    sourceLoader(
      {
        pinia,
        '@packages/toolbox': toolbox,
        electron,
        'electron-store': Storage,
      },
      globals,
    )
  const main = load()
  const api = main(`${root}/main.ts`)
  const messages: any[] = []
  function renderer(id: number) {
    const events = new EventEmitter()
    const sender = new EventEmitter() as EventEmitter & {
      id: number
      send: Function
    }
    sender.id = id
    sender.send = (name: string, payload: any) => {
      messages.push({ to: id, name, payload })
      events.emit(name, {}, structuredClone(payload))
    }
    const ipcRenderer = {
      invoke: async (name: string, payload?: any) =>
        handlers.get(name)!({ sender }, payload),
      send: (name: string, payload: any) => {
        messages.push({ from: id, name, payload })
        ipc.emit(name, { sender }, payload)
      },
      on: (name: string, fn: (...args: any[]) => void) => events.on(name, fn),
    }
    const window: Record<string, any> = {}
    const rendererLoad = load(
      { window },
      {
        ipcRenderer,
        contextBridge: {
          exposeInMainWorld: (name: string, value: any) => {
            window[name] = value
          },
        },
      },
    )
    rendererLoad(`${root}/context-bridge.ts`)
    return { api: rendererLoad(`${root}/renderer.ts`), events, sender, window }
  }
  return {
    ipc,
    handlers,
    storage,
    constructed,
    api,
    main,
    renderer,
    messages,
    failGet: (error: unknown) => {
      getError = error
    },
  }
}

let serial = 0
function store(
  api: any,
  electron?: { persisted?: boolean; shared?: boolean },
  id = `store-${++serial}`,
) {
  const instance = pinia.createPinia()
  const app = createApp({})
  app.use(instance)
  instance.use(api.electronPiniaPlugin())
  const useStore = pinia.defineStore(id, {
    state: () => ({
      count: 0,
      nested: { label: 'default', enabled: true },
      items: [1],
    }),
    actions: {
      add(amount: number) {
        this.count += amount
      },
      fail() {
        throw new Error('action failed')
      },
    },
    electron,
  })
  const result = useStore(instance)
  dispose.push(() => {
    result.$dispose()
  })
  return result
}

async function settle() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('electron-pinia real stores and IPC', () => {
  it('exposes reactive stores, shared readiness registry and unmodified opt-out actions', async () => {
    const t = transport()
    const a = store(t.api)
    const b = store(t.api)
    expect(isReactive(a)).toBe(true)
    expect(await a.$whenReady()).toBe(true)
    expect(a.$whenReady()).toBe(a.$whenReady())
    expect(t.main(`${root}/plugin.ts`).stores.get(a.$id)).toBe(a)
    expect(a.storesStates).toBe(b.storesStates)
    expect(await a.storesStates[b.$id].$whenReady()).toBe(true)
    a.add(3)
    expect(a.count).toBe(3)
    expect(t.messages).toEqual([])
  })

  it('loads persisted values before sharing and fills only missing top-level defaults', async () => {
    const t = transport()
    const r = t.renderer(11)
    t.storage.set('electron-pinia-saved', {
      count: 8,
      nested: { label: 'saved' },
      extra: 'retained',
    })
    const a = store(r.api, { persisted: true, shared: true }, 'saved')
    expect(await a.$whenReady()).toBe(true)
    expect(a.$state).toEqual({
      count: 8,
      nested: { label: 'saved', enabled: true },
      items: [1],
      extra: 'retained',
    })
    expect(t.messages.filter((m) => m.from)).toEqual([])
    expect(t.constructed).toEqual([
      {
        name: 'electron-pinia-saved',
        defaults: undefined,
        cwd: 'electron-pinia',
      },
    ])
  })

  it('persists direct deep mutations, actions, arrays and object patches as detached snapshots', async () => {
    const t = transport()
    const a = store(t.api, { persisted: true })
    await a.$whenReady()
    a.nested.label = 'deep'
    a.items.push(2)
    a.add(4)
    await settle()
    const key = `electron-pinia-${a.$id}`
    expect(t.storage.get(key)).toEqual({
      count: 4,
      nested: { label: 'deep', enabled: true },
      items: [1, 2],
    })
    const previous = t.storage.get(key)
    a.$patch({ nested: { enabled: false } })
    await settle()
    expect(t.storage.get(key).nested).toEqual({ label: 'deep', enabled: false })
    expect(previous.nested.enabled).toBe(true)
  })

  it('stops persistence subscriptions when the real store is disposed', async () => {
    const t = transport()
    const a = store(t.api, { persisted: true })
    await a.$whenReady()
    a.count = 2
    await settle()
    a.$dispose()
    a.count = 9
    await settle()
    expect(t.storage.get(`electron-pinia-${a.$id}`).count).toBe(2)
  })

  it('propagates persistence read errors as the current false readiness rejection', async () => {
    const t = transport()
    t.failGet(new Error('disk unavailable'))
    const a = store(t.api, { persisted: true })
    await expect(a.$whenReady()).rejects.toBe(false)
    expect(a.count).toBe(0)
    expect(t.storage.size).toBe(0)
  })

  it('routes renderer actions and object patches to main and peers without echoing the issuer', async () => {
    const t = transport()
    const r1 = t.renderer(21)
    const r2 = t.renderer(22)
    const main = store(t.api, { shared: true }, 'sync')
    const a = store(r1.api, { shared: true }, 'sync')
    const b = store(r2.api, { shared: true }, 'sync')
    await Promise.all([main.$whenReady(), a.$whenReady(), b.$whenReady()])
    a.add(3)
    expect([main.count, a.count, b.count]).toEqual([3, 3, 3])
    expect(t.messages.filter((m) => m.to === 21)).toEqual([])
    expect(t.messages.filter((m) => m.from).length).toBe(1)
    a.$patch({ nested: { label: 'synced' } })
    expect([main.nested.label, a.nested.label, b.nested.label]).toEqual([
      'synced',
      'synced',
      'synced',
    ])
    expect(t.messages.filter((m) => m.from).length).toBe(2)
  })

  it('broadcasts main patches, isolates store ids and drops destroyed connections', async () => {
    const t = transport()
    const r = t.renderer(31)
    const main = store(t.api, { shared: true }, 'same')
    const a = store(r.api, { shared: true }, 'same')
    const other = store(r.api, { shared: true }, 'other')
    await Promise.all([main.$whenReady(), a.$whenReady(), other.$whenReady()])
    main.$patch({ count: 5 })
    expect(a.count).toBe(5)
    expect(other.count).toBe(0)
    r.sender.emit('destroyed')
    main.$patch({ count: 7 })
    expect(a.count).toBe(5)
  })

  it('keeps function patches and direct deep mutations local in the sharing protocol', async () => {
    const t = transport()
    const r = t.renderer(41)
    const a = store(r.api, { shared: true }, 'local')
    const b = store(t.api, { shared: true }, 'local')
    await Promise.all([a.$whenReady(), b.$whenReady()])
    a.$patch((state) => {
      state.count = 4
    })
    a.nested.label = 'local'
    await settle()
    expect(a.count).toBe(4)
    expect(b.count).toBe(0)
    expect(b.nested.label).toBe('default')
    expect(t.messages).toEqual([])
  })

  it('characterizes retained renderer listeners and action propagation after dispose', async () => {
    const t = transport()
    const r = t.renderer(51)
    const a = store(r.api, { shared: true }, 'disposed')
    await a.$whenReady()
    a.$dispose()
    expect(r.events.listenerCount('electron-pinia-notify-renderers')).toBe(1)
    t.main(`${root}/background.ts`).default.notifyRenderers({
      name: '$patch',
      storeId: 'disposed',
      args: [{ count: 6 }, { issuer: 'main' }],
    })
    expect(a.count).toBe(6)
  })

  it.fails(
    '[known issue] disposed renderer stores should stop receiving IPC updates',
    async () => {
      const t = transport()
      const r = t.renderer(51)
      const a = store(r.api, { shared: true }, 'disposed')
      await a.$whenReady()
      a.$dispose()
      t.main(`${root}/background.ts`).default.notifyRenderers({
        name: '$patch',
        storeId: 'disposed',
        args: [{ count: 6 }, { issuer: 'main' }],
      })
      expect(a.count).toBe(0)
    },
  )

  it('characterizes null arguments throwing before renderer actions execute', async () => {
    const t = transport()
    const r = t.renderer(61)
    const a = store(r.api, { shared: true })
    await a.$whenReady()
    expect(() => (a.add as any)(null)).toThrow(
      "Cannot read properties of null (reading 'issuer')",
    )
    expect(a.count).toBe(0)
    expect(t.messages).toEqual([])
    expect(() => a.fail()).toThrow('action failed')
  })

  it.fails(
    '[known issue] null action arguments should not crash issuer detection',
    async () => {
      const t = transport()
      const r = t.renderer(61)
      const a = store(r.api, { shared: true })
      await a.$whenReady()
      expect(() => (a.add as any)(null)).not.toThrow()
    },
  )

  it('characterizes main actions remaining local while main object patches broadcast', async () => {
    const t = transport()
    const r = t.renderer(81)
    const main = store(t.api, { shared: true }, 'main-action')
    const peer = store(r.api, { shared: true }, 'main-action')
    await Promise.all([main.$whenReady(), peer.$whenReady()])
    main.add(4)
    expect(main.count).toBe(4)
    expect(peer.count).toBe(0)
    main.$patch({ count: 5 })
    expect(peer.count).toBe(5)
  })

  it.fails(
    '[known issue] main actions should propagate to connected renderer stores',
    async () => {
      const t = transport()
      const r = t.renderer(81)
      const main = store(t.api, { shared: true }, 'main-action')
      const peer = store(r.api, { shared: true }, 'main-action')
      await Promise.all([main.$whenReady(), peer.$whenReady()])
      main.add(4)
      expect(peer.count).toBe(4)
    },
  )

  it('normalizes issuer metadata without mutating arguments and supports numeric connection ids', () => {
    const t = transport()
    const utils = t.main(`${root}/utils.ts`)
    const args = [2, { issuer: 7 }, { value: 3 }, { issuer: 'other' }]
    expect(utils.useArgs(args)).toEqual({
      issuer: 7,
      args: [2, { value: 3 }, { issuer: 7 }],
    })
    expect(args).toHaveLength(4)
    expect(utils.useArgs([false, 0])).toEqual({
      issuer: 'main',
      args: [false, 0, { issuer: 'main' }],
    })
  })

  it('exposes storage get/set/delete IPC and rejects duplicate main startup registration', async () => {
    const t = transport()
    const r = t.renderer(71)
    r.window.ElectronPiniaStorage.set('a', { value: 1 })
    expect(await r.window.ElectronPiniaStorage.get('a')).toEqual({ value: 1 })
    r.window.ElectronPiniaStorage.delete('a')
    expect(await r.window.ElectronPiniaStorage.get('a')).toBeUndefined()
    expect(() => t.main(`${root}/background.ts`).default.start()).toThrow(
      'Duplicate handler: electron-pinia-connect',
    )
  })
})
