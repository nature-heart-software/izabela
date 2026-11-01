import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

test('unexpected crashes reload the existing renderer, with a bounded retry budget', () => {
  const timers = new Map(),
    contents = new EventEmitter(),
    window = new EventEmitter()
  let now = 1000,
    reloads = 0,
    destroyed = false,
    id = 0
  Object.assign(window, { webContents: contents, isDestroyed: () => destroyed })
  contents.reload = () => reloads++
  const { recoverRenderer } = loadTypescript(
    fileURLToPath(new URL('./recovery.ts', import.meta.url)),
    {},
    {
      Date: { now: () => now },
      setTimeout: (fn) => {
        timers.set(++id, fn)
        return id
      },
      clearTimeout: (id) => timers.delete(id),
    },
  )
  recoverRenderer(window)
  const gone = (reason) => contents.emit('render-process-gone', {}, { reason })
  const tick = () => {
    for (const [id, fn] of timers) {
      timers.delete(id)
      fn()
    }
  }
  gone('clean-exit')
  gone('killed')
  assert.equal(timers.size, 0)
  for (let n = 0; n < 3; n++) {
    gone('crashed')
    gone('crashed')
    assert.equal(timers.size, 1)
    tick()
  }
  gone('oom')
  tick()
  assert.equal(reloads, 3)
  now += 61000
  gone('crashed')
  tick()
  assert.equal(reloads, 4)
  gone('crashed')
  destroyed = true
  tick()
  assert.equal(reloads, 4)
  destroyed = false
  gone('crashed')
  window.emit('closed')
  assert.equal(timers.size, 0)
})
