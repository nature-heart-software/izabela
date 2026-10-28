import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../tests/load-typescript.cjs'

for (const code of ['EACCES', 'ENOSPC'])
  test(`settings write ${code} keeps IPC and live stores usable, then retries the next change`, async () => {
    const handlers = new Map(),
      errors = [],
      records = new Map()
    let failure = true,
      subscribe
    class Store {
      get(name) {
        return records.get(name)
      }
      set(name, state) {
        if (failure)
          throw Object.assign(Error('controlled write failure'), { code })
        records.set(name, state)
      }
    }
    const { persistStatePlugin } = loadTypescript(
      fileURLToPath(new URL('./persist-state-plugin.ts', import.meta.url)),
      {
        './electron': { isMain: true },
        electron: {
          app: { getPath: () => 'unused-isolated-settings-fixture' },
          ipcMain: {
            handle: (name, fn) => handlers.set(name, fn),
            on: (name, fn) => handlers.set(name, fn),
          },
        },
        'electron-store': Store,
        '@packages/toolbox': {
          purify: (value) => value,
          Deferred: () => {
            let resolve, reject
            const promise = new Promise((a, b) => {
              resolve = a
              reject = b
            })
            return { promise, resolve, reject }
          },
        },
      },
      { console: { error: (...args) => errors.push(args) } },
    )
    const name = 'electron-pinia-settings'
    const old = { theme: 'dark', dictionary: ['保存済み'] }
    records.set(name, old)
    const store = {
      $id: 'settings',
      $state: {},
      $patch(value) {
        this.$state = value
      },
      $subscribe(fn) {
        subscribe = fn
      },
    }
    await persistStatePlugin({ store })
    assert.deepEqual(store.$state, old)
    const setter = handlers.get('electron-pinia-store-set')
    assert.ok(setter, 'Main-process storage handler must be registered')
    const next = { theme: 'light', dictionary: ['保存済み', 'مرحبًا'] }
    assert.equal(setter({}, { name, state: next }), false)
    assert.doesNotThrow(() => subscribe({}, next))
    assert.deepEqual(records.get(name), old)
    assert.equal(errors.length, 2)
    failure = false
    assert.equal(setter({}, { name, state: next }), true)
    assert.deepEqual(records.get(name), next)
    assert.doesNotThrow(() => subscribe({}, old))
    assert.deepEqual(records.get(name), old)
  })
