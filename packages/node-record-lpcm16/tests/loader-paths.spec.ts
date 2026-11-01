import { posix, win32 } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isLoaderFailure, resolveRecorderImport } from './loader-paths'

const fixtures = [
  {
    name: 'posix',
    paths: posix,
    root: '/fixture/node-record-lpcm16',
    entry: '/fixture/node-record-lpcm16/index.js',
    directoryEntry: '/fixture/node-record-lpcm16/recorders/index.js',
    builder: '/fixture/node-record-lpcm16/recorders/sox.js',
    failure: '/fixture/node-record-lpcm16/recorders/failure.js',
  },
  {
    name: 'win32',
    paths: win32,
    root: 'C:\\fixture\\node-record-lpcm16',
    entry: 'C:\\fixture\\node-record-lpcm16\\index.js',
    directoryEntry: 'C:\\fixture\\node-record-lpcm16\\recorders\\index.js',
    builder: 'C:\\fixture\\node-record-lpcm16\\recorders\\sox.js',
    failure: 'C:\\fixture\\node-record-lpcm16\\recorders\\failure.js',
  },
]

describe.each(fixtures)('recorder loader paths ($name)', (fixture) => {
  const { paths, root, entry, directoryEntry, builder, failure } = fixture

  it('resolves the default recorder directory import to its index module', () => {
    expect(resolveRecorderImport(entry, './recorders', paths)).toBe(
      directoryEntry,
    )
  })

  it('preserves an explicit directory index .js import', () => {
    expect(resolveRecorderImport(entry, './recorders/index.js', paths)).toBe(
      directoryEntry,
    )
  })

  it('preserves an explicit builder .js import from the directory index', () => {
    expect(resolveRecorderImport(directoryEntry, './sox.js', paths)).toBe(
      builder,
    )
  })

  it('adds .js to an extensionless builder import', () => {
    expect(resolveRecorderImport(directoryEntry, './sox', paths)).toBe(builder)
  })

  it('matches the injected loader failure without matching other modules', () => {
    expect(isLoaderFailure(failure, root, paths)).toBe(true)
    for (const filename of [entry, directoryEntry, builder, failure + '.map']) {
      expect(isLoaderFailure(filename, root, paths)).toBe(false)
    }
  })
})
