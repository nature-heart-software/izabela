import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import * as fs from 'node:fs/promises'
import test from 'node:test'
import loadTypescript from '../../../../tests/load-typescript.cjs'

const require = createRequire(import.meta.url)
const identity = require('../../application-identity.json')
const filename = fileURLToPath(
  new URL('./overlay-addon-installation.ts', import.meta.url),
)
const oldId = 'a'.repeat(64),
  currentId = 'b'.repeat(64)

async function fixture(t, options = {}) {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'izabela-addon-install-'),
  )
  t.after(async () => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
    assert.ok(path.basename(directory).startsWith('izabela-addon-install-'))
    await fs.rm(directory, { recursive: true, force: true })
  })
  const stateFile = path.join(
    directory,
    'profile/experimental-game-overlay/addon-installation.json',
  )
  const calls = []
  const state = (registrationId = oldId, obsoleteRegistrationIds = []) => ({
    schemaVersion: 1,
    applicationId: identity.applicationId,
    registrationId,
    obsoleteRegistrationIds,
  })
  const seed = async (value) => {
    await fs.mkdir(path.dirname(stateFile), { recursive: true })
    await fs.writeFile(
      stateFile,
      typeof value === 'string' ? value : JSON.stringify(value),
    )
  }
  const read = async () => JSON.parse(await fs.readFile(stateFile, 'utf8'))
  const sdk = {
    async registerOverlayAddonInstallation(value) {
      calls.push({ operation: 'register', options: { ...value } })
      return options.register
        ? options.register(value)
        : { ...value, registrationId: currentId }
    },
    async unregisterOverlayAddonInstallation(value) {
      calls.push({ operation: 'unregister', options: { ...value } })
      await options.unregister?.(value, await read())
    },
  }
  const module = loadTypescript(filename, {
    electron: {
      app: {
        getPath: (name) => {
          assert.equal(name, 'userData')
          return path.join(directory, 'profile')
        },
      },
    },
    '../../application-identity.json': identity,
    'electron-game-overlay/preload': sdk,
    'node:fs/promises': { ...fs, ...options.fs },
  })
  return { ...module, directory, stateFile, calls, sdk, state, seed, read }
}

test('registration uses installer identity and SDK defaults, persisting IDs without SDK paths', async (t) => {
  const f = await fixture(t)
  assert.equal(
    f.OVERLAY_APPLICATION_ID,
    require('../../electron-builder.config.js').appId,
  )
  await f.ensureOverlayAddonInstallation()
  await f.ensureOverlayAddonInstallation()
  assert.deepEqual(
    f.calls,
    [1, 2].map(() => ({
      operation: 'register',
      options: { applicationId: identity.applicationId },
    })),
  )
  assert.deepEqual(await f.read(), f.state(currentId))
  assert.deepEqual(await fs.readdir(path.dirname(f.stateFile)), [
    'addon-installation.json',
  ])
})

test('upgrade saves the new registration before selectively removing the obsolete build', async (t) => {
  const f = await fixture(t, {
    unregister: async (options, saved) => {
      assert.deepEqual(
        { ...options },
        { applicationId: identity.applicationId, registrationId: oldId },
      )
      assert.equal(saved.registrationId, currentId)
      assert.deepEqual(saved.obsoleteRegistrationIds, [oldId])
    },
  })
  await f.seed(f.state())
  await f.ensureOverlayAddonInstallation()
  assert.deepEqual(
    f.calls.map((c) => c.operation),
    ['register', 'unregister'],
  )
  assert.deepEqual(await f.read(), f.state(currentId))
})

test('failed obsolete cleanup is retained for the next setup without unregistering the current ID', async (t) => {
  let fail = true
  const f = await fixture(t, {
    unregister: () => {
      if (fail) throw Object.assign(new Error('SECRET'), { code: 'EIO' })
    },
  })
  await f.seed(f.state())
  await assert.rejects(
    f.ensureOverlayAddonInstallation(),
    (e) =>
      e.stage === 'remove-obsolete' &&
      e.filesystemCode === 'EIO' &&
      !e.message.includes('SECRET'),
  )
  assert.deepEqual(await f.read(), f.state(currentId, [oldId]))
  fail = false
  await f.ensureOverlayAddonInstallation()
  assert.deepEqual(await f.read(), f.state(currentId))
  assert.deepEqual(
    f.calls
      .filter((c) => c.operation === 'unregister')
      .map((c) => c.options.registrationId),
    [oldId, oldId],
  )
})

test('registration failure preserves previous state and reports the setup stage', async (t) => {
  const f = await fixture(t, {
    register: () => {
      throw Object.assign(new Error('SECRET'), { code: 'EACCES' })
    },
  })
  await f.seed(f.state())
  await assert.rejects(
    f.ensureOverlayAddonInstallation(),
    (e) =>
      e.stage === 'register' &&
      e.filesystemCode === 'EACCES' &&
      !e.message.includes('SECRET'),
  )
  assert.deepEqual(await f.read(), f.state())
  assert.equal(f.calls.length, 1)
})

test('failed atomic persistence never removes an old registration or leaves temporary files', async (t) => {
  const f = await fixture(t, {
    fs: {
      rename: async () => {
        throw Object.assign(new Error('SECRET'), { code: 'EACCES' })
      },
    },
  })
  await f.seed(f.state())
  await assert.rejects(
    f.ensureOverlayAddonInstallation(),
    (e) => e.stage === 'save-state' && e.filesystemCode === 'EACCES',
  )
  assert.deepEqual(await f.read(), f.state())
  assert.deepEqual(
    f.calls.map((c) => c.operation),
    ['register'],
  )
  assert.deepEqual(await fs.readdir(path.dirname(f.stateFile)), [
    'addon-installation.json',
  ])
})

test('malformed or foreign registration metadata is rejected before changing SDK registrations', async (t) => {
  for (const value of [
    '{broken',
    JSON.stringify({
      schemaVersion: 1,
      applicationId: 'another.app',
      registrationId: oldId,
      obsoleteRegistrationIds: [],
    }),
  ]) {
    const f = await fixture(t)
    await f.seed(value)
    await assert.rejects(
      f.ensureOverlayAddonInstallation(),
      (e) => e.stage === 'read-state',
    )
    assert.deepEqual(f.calls, [])
  }
})

test('overlapping activations share registration and persistence work', async (t) => {
  let resolve, entered
  const gate = new Promise((r) => {
      resolve = r
    }),
    started = new Promise((r) => {
      entered = r
    })
  const f = await fixture(t, {
    register: async (value) => {
      entered()
      await gate
      return { ...value, registrationId: currentId }
    },
  })
  const first = f.ensureOverlayAddonInstallation(),
    second = f.ensureOverlayAddonInstallation()
  assert.equal(first, second)
  await started
  assert.equal(f.calls.length, 1)
  resolve()
  await Promise.all([first, second])
  assert.deepEqual(await f.read(), f.state(currentId))
})

test('real unmodified SDK registration caches both architectures idempotently in isolated test storage', async (t) => {
  const actual = require('electron-game-overlay/preload')
  let storageRoot
  const f = await fixture(t, {
    register: (options) =>
      actual.registerOverlayAddonInstallation({ ...options, storageRoot }),
  })
  storageRoot = path.join(f.directory, 'isolated-sdk-registry')
  await f.ensureOverlayAddonInstallation()
  const first = await f.read()
  await f.ensureOverlayAddonInstallation()
  assert.deepEqual(await f.read(), first)
  const registry = JSON.parse(
    await fs.readFile(path.join(storageRoot, 'registrations.json'), 'utf8'),
  )
  assert.equal(registry.registrations.length, 1)
  assert.equal(registry.registrations[0].applicationId, identity.applicationId)
  assert.equal(registry.registrations[0].registrationId, first.registrationId)
  const installation = await actual.registerOverlayAddonInstallation({
    applicationId: identity.applicationId,
    storageRoot,
  })
  for (const file of [installation.addonPath, installation.x86AddonPath])
    assert.ok((await fs.stat(file)).size > 0)
  await actual.unregisterOverlayAddonInstallation({
    applicationId: first.applicationId,
    registrationId: first.registrationId,
    storageRoot,
  })
  assert.equal(
    JSON.parse(
      await fs.readFile(path.join(storageRoot, 'registrations.json'), 'utf8'),
    ).registrations.length,
    0,
  )
})
