import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
  access,
  copyFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import buildScript from '../bin/build.js?raw'

const require = createRequire(import.meta.url)
const gelectron = path.dirname(require.resolve('gelectron/package.json'))
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const binaries = [
  'injector_helper.exe',
  'injector_helper.x64.exe',
  'n_overlay.dll',
  'n_overlay.x64.dll',
]
let sandbox: string
let source: string
let staging: string
let output: string

async function put(file: string, contents: string) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, contents)
}

beforeEach(async () => {
  sandbox = await mkdtemp(path.join(tmpdir(), 'electron-game-overlay-'))
  source = path.join(sandbox, 'node_modules/gelectron')
  staging = path.join(sandbox, 'packages/electron-game-overlay/build/gelectron')
  output = path.join(sandbox, 'packages/electron-game-overlay/dist')
  await put(
    path.join(source, 'package.json'),
    JSON.stringify({ name: 'gelectron', version: '1.0.1' }),
  )
  await put(
    path.join(sandbox, 'node_modules/cmake-js/bin/cmake-js.js'),
    '// Native compiler boundary',
  )
  await put(
    path.join(sandbox, 'apps/app/package.json'),
    JSON.stringify({ devDependencies: { electron: '42.0.0' } }),
  )
  await mkdir(path.join(source, 'electron-overlay'), { recursive: true })
  await copyFile(
    path.join(gelectron, 'electron-overlay/index.js'),
    path.join(source, 'electron-overlay/index.js'),
  )
  await copyFile(
    path.join(gelectron, 'electron-overlay/index.d.ts'),
    path.join(source, 'electron-overlay/index.d.ts'),
  )
  await mkdir(path.join(source, 'electron-overlay/src'), { recursive: true })
  await copyFile(
    path.join(gelectron, 'electron-overlay/src/overlay.h'),
    path.join(source, 'electron-overlay/src/overlay.h'),
  )
  for (const binary of binaries)
    await put(
      path.join(source, 'game-overlay/prebuilt', binary),
      `fixture:${binary}`,
    )
  await put(path.join(source, 'node_modules/ignored.js'), 'not copied')
  await put(path.join(source, 'nested/node_modules/ignored.js'), 'not copied')
  await put(path.join(source, 'build_x64/stale.node'), 'not copied')
  await put(path.join(source, 'nested/build_x64/stale.node'), 'not copied')
  await put(path.join(source, 'nested/build_x64_notes/keep.txt'), 'keep')
  await put(path.join(staging, 'stale.txt'), 'remove before compilation')
})

afterEach(async () => {
  await rm(sandbox, { recursive: true, force: true })
})

function executeBuild(arch = 'x64', outcome: number | Error = 0) {
  const spawn = vi.fn(
    (_command: string, _args: string[], options: { cwd: string }) => {
      const child = new EventEmitter()
      queueMicrotask(async () => {
        if (outcome instanceof Error) {
          child.emit('error', outcome)
          return
        }
        if (outcome === 0) {
          await put(
            path.join(options.cwd, 'electron-overlay/electron-overlay.node'),
            'fixture:compiled native addon',
          )
        }
        child.emit('exit', outcome)
      })
      return child
    },
  )
  const fixtureURL = pathToFileURL(
    path.join(sandbox, 'packages/electron-game-overlay/bin/build.js'),
  ).href
  const compiled = ts.transpileModule(buildScript, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    transformers: {
      before: [
        (context) => {
          const visit: ts.Visitor = (node) => {
            if (ts.isIdentifier(node) && node.text === 'require')
              return ts.factory.createIdentifier('nativeRequire')
            if (
              ts.isMetaProperty(node) &&
              node.keywordToken === ts.SyntaxKind.ImportKeyword
            ) {
              return ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(
                  'url',
                  ts.factory.createStringLiteral(fixtureURL),
                ),
              ])
            }
            return ts.visitEachChild(node, visit, context)
          }
          return (file) => ts.visitNode(file, visit) as ts.SourceFile
        },
      ],
    },
  }).outputText
  const load = (name: string) =>
    name === 'node:child_process' ? { spawn } : require(name)
  const processBoundary = { execPath: process.execPath, env: process.env, arch }
  return {
    spawn,
    finished: new AsyncFunction('require', 'exports', 'process', compiled)(
      load,
      {},
      processBoundary,
    ) as Promise<void>,
  }
}

describe('native overlay packaging', () => {
  it('patches the staged framebuffer cleanup without changing upstream source', async () => {
    const headerPath = 'electron-overlay/src/overlay.h'
    const header = await readFile(path.join(source, headerPath), 'utf8')
    await executeBuild().finished
    const stagedHeader = await readFile(path.join(staging, headerPath), 'utf8')
    const newline = header.includes('\r\n') ? '\r\n' : '\n'
    const cleanup = `        shareMemMap_.erase(message.windowId);${newline}`
    expect(stagedHeader).toContain(cleanup)
    expect(stagedHeader.replace(cleanup, '')).toBe(header)
    expect(await readFile(path.join(source, headerPath), 'utf8')).toBe(header)
  })

  it('rejects changed upstream cleanup source before compiling or publishing', async () => {
    const headerPath = path.join(source, 'electron-overlay/src/overlay.h')
    const header = await readFile(headerPath, 'utf8')
    expect(header).toContain('windows_.erase(it);')
    await writeFile(
      headerPath,
      header.replace('windows_.erase(it);', 'windows_.clear();'),
    )
    const build = executeBuild()
    await expect(build.finished).rejects.toThrow(
      'Unexpected gelectron closeWindow source; refusing native build',
    )
    expect(build.spawn).not.toHaveBeenCalled()
    await expect(access(path.join(output, 'index.cjs'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('cleans staging and copies real wrapper files while excluding nested dependencies and old builds', async () => {
    const build = executeBuild()
    await build.finished
    await expect(access(path.join(staging, 'stale.txt'))).rejects.toMatchObject(
      { code: 'ENOENT' },
    )
    for (const excluded of [
      'node_modules/ignored.js',
      'nested/node_modules/ignored.js',
      'build_x64/stale.node',
      'nested/build_x64/stale.node',
    ]) {
      await expect(access(path.join(staging, excluded))).rejects.toMatchObject({
        code: 'ENOENT',
      })
    }
    expect(
      await readFile(
        path.join(staging, 'nested/build_x64_notes/keep.txt'),
        'utf8',
      ),
    ).toBe('keep')
    expect(
      await readFile(path.join(source, 'node_modules/ignored.js'), 'utf8'),
    ).toBe('not copied')
  })

  it.each(['x64', 'arm64'])(
    'compiles once for Electron with the %s architecture and matching Visual Studio platform',
    async (arch) => {
      const build = executeBuild(arch)
      await build.finished
      expect(build.spawn).toHaveBeenCalledExactlyOnceWith(
        process.execPath,
        [
          path.join(sandbox, 'node_modules/cmake-js/bin/cmake-js.js'),
          'compile',
          '--runtime',
          'electron',
          '--runtime-version',
          '42.0.0',
          '--arch',
          arch,
          '-G',
          'Visual Studio 17 2022',
          '-A',
          arch === 'arm64' ? 'ARM64' : 'x64',
          '-O',
          'build_x64',
          '--CDROOT_DIR=' + staging.replaceAll('\\', '/'),
        ],
        { cwd: staging, env: process.env, stdio: 'inherit' },
      )
    },
  )

  it('copies the generated addon, real CommonJS entry, declarations, and all four native helper assets', async () => {
    await executeBuild().finished
    expect(
      await readFile(path.join(output, 'electron-overlay.node'), 'utf8'),
    ).toBe('fixture:compiled native addon')
    const wrapper = await readFile(
      path.join(gelectron, 'electron-overlay/index.js'),
      'utf8',
    )
    expect(await readFile(path.join(output, 'index.js'), 'utf8')).toBe(wrapper)
    expect(await readFile(path.join(output, 'index.cjs'), 'utf8')).toBe(wrapper)
    expect(await readFile(path.join(output, 'index.d.ts'), 'utf8')).toBe(
      await readFile(
        path.join(gelectron, 'electron-overlay/index.d.ts'),
        'utf8',
      ),
    )
    for (const binary of binaries)
      expect(await readFile(path.join(output, binary), 'utf8')).toBe(
        `fixture:${binary}`,
      )
  })

  it('leaves unrelated Vite outputs intact when adding native files', async () => {
    await put(path.join(output, 'main.d.ts'), 'export {}')
    await executeBuild().finished
    expect(await readFile(path.join(output, 'main.d.ts'), 'utf8')).toBe(
      'export {}',
    )
  })

  it('loads the packaged CommonJS wrapper against only the native addon boundary', async () => {
    await executeBuild().finished
    const native = {
      start: vi.fn(),
      stop: vi.fn(),
      getTopWindows: vi.fn(() => [{ windowId: 5, processId: 6 }]),
    }
    const loadNative = vi.fn((request: string) => {
      if (request !== './electron-overlay.node')
        throw new Error(`Unexpected native dependency: ${request}`)
      return native
    })
    const module = { exports: {} as typeof native }
    const wrapper = await readFile(path.join(output, 'index.cjs'), 'utf8')
    new Function('require', 'module', wrapper)(loadNative, module)
    expect(module.exports).toBe(native)
    module.exports.start()
    expect(module.exports.getTopWindows()).toEqual([
      { windowId: 5, processId: 6 },
    ])
    module.exports.stop()
    expect(loadNative).toHaveBeenCalledExactlyOnceWith(
      './electron-overlay.node',
    )
    expect(native.start).toHaveBeenCalledExactlyOnceWith()
    expect(native.stop).toHaveBeenCalledExactlyOnceWith()
  })

  it('propagates a native compiler spawn error without publishing wrapper output', async () => {
    const error = new Error('compiler unavailable')
    await expect(executeBuild('x64', error).finished).rejects.toBe(error)
    await expect(access(path.join(output, 'index.cjs'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('rejects a nonzero compiler exit with its invocation and exit code', async () => {
    await expect(executeBuild('x64', 7).finished).rejects.toThrow(
      `exited with code 7`,
    )
    await expect(access(path.join(output, 'index.cjs'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('fails early when source staging cannot read the native dependency', async () => {
    await rm(source, { recursive: true })
    const build = executeBuild()
    await expect(build.finished).rejects.toThrow()
    expect(build.spawn).not.toHaveBeenCalled()
  })

  it('rejects a missing required helper instead of reporting a complete native package', async () => {
    await rm(path.join(source, 'game-overlay/prebuilt/n_overlay.x64.dll'))
    const build = executeBuild()
    await expect(build.finished).rejects.toMatchObject({ code: 'ENOENT' })
    expect(build.spawn).toHaveBeenCalledTimes(1)
  })
})
