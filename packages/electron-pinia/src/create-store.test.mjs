import assert from 'node:assert/strict'
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import test from 'node:test'
import loadTypescript from '../../../tests/load-typescript.cjs'
const { createStore } = loadTypescript(
  fileURLToPath(new URL('./create-store.ts', import.meta.url)),
)

test('damaged JSON is preserved byte for byte before a store starts with defaults', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'izabela-store-'))
  mkdirSync(path.join(root, 'electron-pinia'))
  const filename = path.join(root, 'electron-pinia', 'settings.json')
  writeFileSync(filename, '{"settings": incomplete')
  class Store {
    constructor() {
      try {
        this.value = JSON.parse(readFileSync(filename, 'utf8'))
      } catch (e) {
        if (e.code === 'ENOENT') this.value = { defaults: true }
        else throw e
      }
    }
  }
  try {
    const store = createStore(
      Store,
      { cwd: 'electron-pinia', name: 'settings' },
      root,
    )
    assert.deepEqual(store.value, { defaults: true })
    const backups = readdirSync(path.dirname(filename))
    assert.equal(backups.length, 1)
    assert.match(backups[0], /^settings.json.corrupt-/)
    assert.equal(
      readFileSync(path.join(path.dirname(filename), backups[0]), 'utf8'),
      '{"settings": incomplete',
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
test('permission errors propagate without resetting or moving user data', () => {
  const error = Object.assign(Error('denied'), { code: 'EACCES' })
  class Store {
    constructor() {
      throw error
    }
  }
  assert.throws(
    () =>
      createStore(Store, { cwd: 'electron-pinia', name: 'settings' }, 'unused'),
    (actual) => actual === error,
  )
})
