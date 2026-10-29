import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const require = createRequire(import.meta.url)
const execFileAsync = promisify(execFile)
const binPath = path.dirname(fileURLToPath(import.meta.url))
const upstreamHeaderPath = path.join(
  path.dirname(require.resolve('gelectron/package.json')),
  'electron-overlay/src/overlay.h',
)
const headerPath = 'electron-overlay/src/overlay.h'

async function fixture(t, transform = (source) => source) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'overlay-build-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const packagePath = path.join(root, 'packages/electron-game-overlay')
  const sourcePath = path.join(root, 'node_modules/gelectron')
  const stagePath = path.join(packagePath, 'build/gelectron')
  const put = async (relative, content) => {
    const destination = path.join(root, relative)
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, content)
  }
  await put('package.json', JSON.stringify({ type: 'module' }))
  await mkdir(path.join(packagePath, 'bin'), { recursive: true })
  await cp(
    path.join(binPath, 'build.js'),
    path.join(packagePath, 'bin/build.js'),
  )
  await put(
    'apps/app/package.json',
    await readFile(
      new URL('../../../apps/app/package.json', import.meta.url),
      'utf8',
    ),
  )
  await mkdir(path.join(root, 'node_modules'), { recursive: true })
  await symlink(
    path.dirname(require.resolve('fs-extra/package.json')),
    path.join(root, 'node_modules/fs-extra'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )
  const source = transform(await readFile(upstreamHeaderPath, 'utf8'))
  await put(`node_modules/gelectron/${headerPath}`, source)
  await put('node_modules/gelectron/package.json', '{}')
  await put('node_modules/gelectron/node_modules/excluded', 'excluded')
  await put('node_modules/gelectron/build_x64/excluded', 'excluded')
  // Observe the real build's staging boundary, then stop before native compilation.
  await put(
    'node_modules/cmake-js/package.json',
    JSON.stringify({ type: 'commonjs' }),
  )
  await put(
    'node_modules/cmake-js/bin/cmake-js.js',
    `
    const fs = require('node:fs')
    fs.writeFileSync('compile-observation.json', JSON.stringify({
      header: fs.readFileSync('${headerPath}', 'utf8'),
      args: process.argv.slice(2),
      cwd: process.cwd(),
    }))
    process.exit(73)
  `,
  )
  const run = async () => {
    try {
      await execFileAsync(
        process.execPath,
        [path.join(packagePath, 'bin/build.js')],
        { timeout: 10000 },
      )
      assert.fail('the controlled compiler boundary must stop the build')
    } catch (error) {
      assert.equal(error.code, 1)
      return error.stderr
    }
  }
  return { run, source, sourcePath, stagePath }
}

for (const [name, transform] of [
  [
    'changed method',
    (source) => source.replace('windows_.erase(it);', 'windows_.clear();'),
  ],
  [
    'duplicate method',
    (source) =>
      source +
      source.slice(
        source.indexOf('    Napi::Value closeWindow('),
        source.indexOf('    Napi::Value sendWindowBounds('),
      ),
  ],
  [
    'already patched method',
    (source) =>
      source.replace(
        'windows_.erase(it);',
        'windows_.erase(it);\r\n            shareMemMap_.erase(message.windowId);',
      ),
  ],
]) {
  test(`build refuses a ${name} before invoking the compiler`, async (t) => {
    const f = await fixture(t, transform)
    const stderr = await f.run()
    assert.match(
      stderr,
      /Unexpected gelectron closeWindow source; refusing native build/,
    )
    await assert.rejects(
      readFile(path.join(f.stagePath, 'compile-observation.json')),
      { code: 'ENOENT' },
    )
    assert.equal(
      await readFile(path.join(f.stagePath, headerPath), 'utf8'),
      f.source,
    )
    assert.equal(
      await readFile(path.join(f.sourcePath, headerPath), 'utf8'),
      f.source,
    )
  })
}

test('LF staging preserves the rest of the upstream header', async (t) => {
  const f = await fixture(t, (source) => source.replaceAll('\r\n', '\n'))
  assert.match(await f.run(), /exited with code 73/)
  const observation = JSON.parse(
    await readFile(path.join(f.stagePath, 'compile-observation.json'), 'utf8'),
  )
  assert.ok(
    observation.header.includes('shareMemMap_.erase(message.windowId);'),
  )
  assert.equal(
    observation.header.replace(
      '        shareMemMap_.erase(message.windowId);\n',
      '',
    ),
    f.source,
  )
})

test('build staging inserts closed-framebuffer cleanup before reaching the compiler', async (t) => {
  const f = await fixture(t)
  const stderr = await f.run()
  assert.match(stderr, /exited with code 73/)
  const observation = JSON.parse(
    await readFile(path.join(f.stagePath, 'compile-observation.json'), 'utf8'),
  )
  const closeWindow = observation.header.slice(
    observation.header.indexOf('    Napi::Value closeWindow('),
    observation.header.indexOf('    Napi::Value sendWindowBounds('),
  )
  assert.match(
    closeWindow,
    /windows_\.erase\(it\);[\s\S]*shareMemMap_\.erase\(message\.windowId\);[\s\S]*return env\.Undefined\(\);/,
  )
  assert.equal(
    observation.header.replace(
      '        shareMemMap_.erase(message.windowId);\r\n',
      '',
    ),
    f.source,
  )
  assert.equal(
    await readFile(path.join(f.sourcePath, headerPath), 'utf8'),
    f.source,
  )
  await assert.rejects(
    readFile(path.join(f.stagePath, 'node_modules/excluded')),
    { code: 'ENOENT' },
  )
  await assert.rejects(readFile(path.join(f.stagePath, 'build_x64/excluded')), {
    code: 'ENOENT',
  })
  assert.ok(observation.args.includes('electron'))
})
