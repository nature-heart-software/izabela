import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

test('closed renderers are removed without deleting a replacement instance', async () => {
  const manager = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    { './recovery': { recoverRenderer() {} } },
  ).default
  const first = new EventEmitter()
  await manager.registerInstance('optional', async () => first)
  first.emit('closed')
  assert.equal(manager.getInstanceByName('optional'), undefined)
  assert.equal(manager.getInstances().length, 0)
  await manager.registerInstance('optional', async () => first)
  const second = new EventEmitter()
  await manager.registerInstance('optional', async () => second)
  first.emit('closed')
  assert.equal(manager.getInstanceByName('optional').window, second)
  second.emit('closed')
  assert.equal(manager.getInstances().length, 0)
})
