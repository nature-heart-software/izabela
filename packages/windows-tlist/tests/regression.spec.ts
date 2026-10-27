import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const root = dirname(fileURLToPath(new URL('../index.js', import.meta.url)))
function load(directory = root) {
  const callbacks: Array<
    (error: Error | null, stdout?: string, stderr?: string) => void
  > = []
  const exec = vi.fn(
    (
      command: string,
      callback: (error: Error | null, stdout?: string, stderr?: string) => void,
    ) => {
      callbacks.push(callback)
    },
  )
  const module = { exports: {} as typeof import('..') }
  const source = readFileSync(join(root, 'index.js'), 'utf8')
  runInNewContext(source, {
    module,
    __dirname: directory,
    require: (id: string) => {
      if (id === 'child_process') return { exec }
      if (id === 'path') return { join }
      throw new Error(`Unexpected require: ${id}`)
    },
  })
  return { api: module.exports, exec, callbacks }
}
const empty = {
  modules: [],
  threads: [],
  workingDirectory: '',
  command: '',
  virtualMemory: { current: 0, peak: 0 },
  workingMemory: { current: 0, peak: 0 },
  threadCount: 0,
}
const output = `Process 42: 程序.exe\r
 CWD: C:\\用户\\工作\r
 CmdLine: "C:\\程序.exe" --flag ü\r
 VirtualSize: 120 KB PeakVirtualSize: 240 KB\r
 WorkingSetSize: 30 KB PeakWorkingSetSize: 60 KB\r
 NumberOfThreads: 2\r
 101 Win32StartAddr: 0xAB LastErr: 0x0 State: RUNNING\r
 102 Win32StartAddr: 0xCD LastErr: 0x5 State: Waiting\r
 1.2.3 A 0xAB C:\\模块.dll\r
 4.5 B 0xCD C:\\with spaces\\another.dll\r
`
async function parse(stdout: string, stderr = '') {
  const loaded = load()
  const promise = loaded.api.getProcessInfo(42)
  loaded.callbacks[0](null, stdout, stderr)
  return promise
}

describe('windows-tlist real CommonJS implementation at exec boundary', () => {
  it('parses CRLF headers, unicode, modules, threads, memory and command whitespace', async () => {
    expect(await parse(output)).toEqual({
      modules: [
        {
          version: '1.2.3',
          _attributes: 'A',
          address: '0xAB',
          path: 'C:\\模块.dll',
        },
        {
          version: '4.5',
          _attributes: 'B',
          address: '0xCD',
          path: 'C:\\with spaces\\another.dll',
        },
      ],
      threads: [
        { id: 101, startAddress: '0xAB', lastError: '0x0', state: 'running' },
        { id: 102, startAddress: '0xCD', lastError: '0x5', state: 'waiting' },
      ],
      workingDirectory: 'C:\\用户\\工作',
      command: '"C:\\程序.exe" --flag ü',
      virtualMemory: { current: 120, peak: 240 },
      workingMemory: { current: 30, peak: 60 },
      threadCount: 2,
    })
  })
  it.each([
    '',
    'Process header only',
    'garbage\nVirtualSize: nope KB\nNumberOfThreads: -1\nWorkingSetSize: NaN KB',
  ])('defaults missing/malformed fields: %j', async (stdout) => {
    expect(await parse(stdout)).toEqual(empty)
  })
  it('accepts case-insensitive labels and tab-separated fields', async () => {
    expect(
      await parse(
        '\tcwd\t:\tD:\\test\nnumberofthreads : 0003\nvirtualsize : 001 KB\tpeakvirtualsize : 002 KB',
      ),
    ).toMatchObject({
      workingDirectory: 'D:\\test',
      threadCount: 3,
      virtualMemory: { current: 1, peak: 2 },
    })
  })
  it('ignores stderr when exec reports success', async () => {
    expect(await parse('', 'warning')).toEqual(empty)
  })
  it('retains first scalar match and every module/thread match', async () => {
    expect(
      await parse('CWD: first\nCWD: second\nNumberOfThreads: 7'),
    ).toMatchObject({ workingDirectory: 'first', threadCount: 7, threads: [] })
  })
  it.each([undefined, 0, NaN])('uses self-query for falsy PID %s', (pid) => {
    const { api, exec } = load()
    void api.getProcessInfo(pid)
    expect(exec).toHaveBeenCalledWith(
      `"${join(root, 'tlist.exe')}" "tlist.exe"`,
      expect.any(Function),
    )
    expect(exec.mock.calls[0]).toHaveLength(2)
  })
  it.each([
    [42.9, '42'],
    [-5, '-5'],
    [Infinity, 'NaN'],
  ])('normalizes PID %s without passing exec options', (pid, expected) => {
    const { api, exec } = load()
    void api.getProcessInfo(pid as number)
    expect(exec.mock.calls[0][0]).toBe(
      `"${join(root, 'tlist.exe')}" "${expected}"`,
    )
    expect(exec.mock.calls[0]).toHaveLength(2)
  })
  it('rewrites only the app.asar segment before quoting executable paths with spaces', () => {
    const directory = join(root, 'folder with spaces', 'app.asar', 'package')
    const { api, exec } = load(directory)
    void api.getProcessInfo(1)
    expect(exec.mock.calls[0][0]).toBe(
      `"${join(root, 'folder with spaces', 'app.asar.unpacked', 'package', 'tlist.exe')}" "1"`,
    )
  })
  it('stays pending until callback, then resolves once despite duplicate callbacks', async () => {
    const { api, callbacks } = load()
    const settled = vi.fn()
    const result = api.getProcessInfo(1)
    void result.then(settled)
    await Promise.resolve()
    expect(settled).not.toHaveBeenCalled()
    callbacks[0](null, 'NumberOfThreads: 3')
    callbacks[0](new Error('late'))
    expect(await result).toMatchObject({ threadCount: 3 })
    expect(settled).toHaveBeenCalledTimes(1)
  })
  it('rejects with original exec error before parsing undefined stdout', async () => {
    const { api, callbacks } = load()
    const error = Object.assign(new Error('exec failed'), {
      code: 1,
      killed: true,
    })
    const result = api.getProcessInfo(2)
    const assertion = expect(result).rejects.toBe(error)
    callbacks[0](error)
    await assertion
  })
  it('keeps concurrent callbacks independent and returns fresh arrays', async () => {
    const { api, callbacks } = load()
    const first = api.getProcessInfo(1)
    const second = api.getProcessInfo(2)
    callbacks[1](null, 'NumberOfThreads: 2')
    callbacks[0](null, '')
    expect(await second).toMatchObject({ threadCount: 2 })
    expect(await first).toEqual(empty)
    expect((await first).modules).not.toBe((await second).modules)
  })
  it('characterizes malformed thread identifiers as NaN', async () => {
    expect(
      (await parse('bad Win32StartAddr: 0x1 LastErr: 0x0 State: RUNNING'))
        .threads[0],
    ).toEqual({
      id: NaN,
      startAddress: '0x1',
      lastError: '0x0',
      state: 'running',
    })
  })
  it.fails(
    '[known issue] malformed thread identifiers should be excluded',
    async () => {
      expect(
        (await parse('bad Win32StartAddr: 0x1 LastErr: 0x0 State: RUNNING'))
          .threads,
      ).toEqual([])
    },
  )
})
