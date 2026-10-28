import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { generateKeyPairSync } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

test('credential imports validate before replacing a working file and replace valid files atomically', async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'izabela-credentials-'),
  )
  const source = path.join(directory, 'selected.json')
  const create = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      electron: { app: { getPath: () => directory } },
      '@/modules/electron-window-manager': {},
      '@/features/settings/store': {},
      '@root/package.json': { productName: 'test' },
      '@/modules/electron-dialog': {},
    },
  ).ElectronFilesystem
  const api = create()
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  })
  const valid = JSON.stringify({
    type: 'service_account',
    project_id: 'fixture',
    client_email: 'fixture@example.invalid',
    private_key: privateKey,
  })
  try {
    await writeFile(source, valid)
    const saved = await api.importGoogleCloudSpeechCredentials(source)
    assert.equal(await readFile(saved, 'utf8'), valid)
    for (const invalid of [
      '{',
      '{}',
      'null',
      JSON.stringify({
        type: 'service_account',
        project_id: 'fixture',
        client_email: 'fixture@example.invalid',
        private_key: 'broken',
      }),
    ]) {
      await writeFile(source, invalid)
      await assert.rejects(api.importGoogleCloudSpeechCredentials(source))
      assert.equal(await readFile(saved, 'utf8'), valid)
    }
    const updated = valid.replace(
      'fixture@example.invalid',
      'updated@example.invalid',
    )
    await writeFile(source, updated)
    await api.importGoogleCloudSpeechCredentials(source)
    assert.equal(await readFile(saved, 'utf8'), updated)
    assert.deepEqual(await readdir(path.dirname(saved)), [
      'google-cloud-speech-credentials.json',
    ])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
