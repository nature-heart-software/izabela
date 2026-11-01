import assert from 'node:assert/strict'
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
const appRequire = createRequire(
  new URL('../../apps/app/package.json', import.meta.url),
)
const Conf = createRequire(appRequire.resolve('electron-store'))('conf')
for (const mode of ['crash', 'EACCES', 'ENOSPC'])
  test(`actual settings storage preserves the last complete save after ${mode}`, async () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'izabela-atomic-'))
    const settings = {
      theme: 'dark',
      dictionary: [['brb', 'Be right back.']],
      history: ['保存済み', 'مرحبًا'],
    }
    writeFileSync(
      path.join(directory, 'settings.json'),
      JSON.stringify({ settings }),
    )
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(new URL('./storage-writer.cjs', import.meta.url)),
        directory,
        mode,
      ],
      { windowsHide: true, stdio: 'pipe' },
    )
    let log = ''
    child.stderr.on('data', (data) => {
      log += data
    })
    const exited = once(child, 'exit')
    const timer = setTimeout(() => child.kill('SIGKILL'), 15000)
    try {
      if (mode === 'crash') {
        const deadline = Date.now() + 10000
        while (
          !existsSync(path.join(directory, 'at-commit')) &&
          Date.now() < deadline &&
          child.exitCode === null
        )
          await sleep(20)
        assert.ok(
          existsSync(path.join(directory, 'at-commit')),
          'Writer did not reach atomic commit: ' + log,
        )
        child.kill('SIGKILL')
      }
      const [code] = await exited
      if (mode !== 'crash') {
        assert.equal(code, 0, log)
        assert.equal(
          JSON.parse(readFileSync(path.join(directory, 'failure.json'))).code,
          mode,
        )
      }
      const reopened = new Conf({ cwd: directory, configName: 'settings' })
      assert.deepEqual(reopened.get('settings'), settings)
      reopened.set('settings.theme', 'light')
      assert.equal(
        new Conf({ cwd: directory, configName: 'settings' }).get(
          'settings.theme',
        ),
        'light',
      )
    } finally {
      clearTimeout(timer)
      if (child.exitCode === null) {
        child.kill('SIGKILL')
        await exited
      }
      assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
      rmSync(directory, { recursive: true, force: true, maxRetries: 5 })
    }
  })
