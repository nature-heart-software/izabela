import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import type * as Public from '..'

const filename = resolve('packages/native-keymap/index.js')
const original = readFileSync(filename, 'utf8')

function load(
  options: {
    releaseError?: Error
    debugError?: Error
    native?: Partial<typeof Public>
  } = {},
) {
  const callbacks: (() => void)[] = []
  const native = {
    getKeyMap: vi.fn<typeof Public.getKeyMap>(
      options.native?.getKeyMap ??
        (() => ({
          KeyA: {
            value: 'a',
            withShift: 'A',
            withAltGr: 'ą',
            withShiftAltGr: 'Ą',
          },
        })),
    ),
    getCurrentKeyboardLayout: vi.fn<typeof Public.getCurrentKeyboardLayout>(
      options.native?.getCurrentKeyboardLayout ??
        (() => ({
          model: 'pc105',
          group: 0,
          layout: 'pl',
          variant: '',
          options: '',
          rules: 'evdev',
        })),
    ),
    onDidChangeKeyboardLayout: vi.fn(
      options.native?.onDidChangeKeyboardLayout ??
        ((callback: () => void) => {
          callbacks.push(callback)
        }),
    ),
    isISOKeyboard: vi.fn(options.native?.isISOKeyboard ?? (() => true)),
  }
  const error = vi.fn()
  const requireBoundary = vi.fn((id: string) => {
    if (id === './build/Release/keymapping') {
      if (options.releaseError) throw options.releaseError
      return native
    }
    if (id === './build/Debug/keymapping') {
      if (options.debugError) throw options.debugError
      return native
    }
    throw new Error(`Unexpected boundary: ${id}`)
  })
  const exports = {} as typeof Public
  // Only the .node-loading boundary and console are controlled; the wrapper is actual source.
  runInNewContext(
    original,
    { exports, require: requireBoundary, console: { error } },
    { filename, timeout: 1000 },
  )
  return { api: exports, native, callbacks, requireBoundary, error }
}

describe('actual native-keymap JavaScript boundary', () => {
  it('exports only the four native wrapper functions without eagerly loading hardware', () => {
    const { api, requireBoundary } = load()
    expect(Object.keys(api).sort()).toEqual([
      'getCurrentKeyboardLayout',
      'getKeyMap',
      'isISOKeyboard',
      'onDidChangeKeyboardLayout',
    ])
    expect(requireBoundary).not.toHaveBeenCalled()
  })

  it('preserves mapping/layout identity and reads fresh native values on each getter', () => {
    const { api, native, requireBoundary } = load()
    const map = {
      KeyQ: { value: 'q', withShift: 'Q', withAltGr: '@', withShiftAltGr: '' },
    }
    native.getKeyMap.mockReturnValue(map)
    expect(api.getKeyMap()).toBe(map)
    const changed = {
      ...map,
      Space: { value: ' ', withShift: ' ', withAltGr: '', withShiftAltGr: '' },
    }
    native.getKeyMap.mockReturnValue(changed)
    expect(api.getKeyMap()).toBe(changed)
    expect(api.getCurrentKeyboardLayout()).toBe(
      native.getCurrentKeyboardLayout.mock.results[0].value,
    )
    expect(api.isISOKeyboard()).toBe(true)
    expect(requireBoundary.mock.calls).toEqual([['./build/Release/keymapping']])
    expect(native.getKeyMap).toHaveBeenCalledTimes(2)
  })

  it('falls back to Debug only after Release fails and caches the selected binding', () => {
    const { api, requireBoundary, error } = load({
      releaseError: new Error('release unavailable'),
    })
    expect(api.isISOKeyboard()).toBe(true)
    api.getKeyMap()
    expect(requireBoundary.mock.calls).toEqual([
      ['./build/Release/keymapping'],
      ['./build/Debug/keymapping'],
    ])
    expect(error).not.toHaveBeenCalled()
  })

  it('returns exact failure sentinels and does not retry missing binaries', () => {
    const failure = new Error('debug unavailable')
    const { api, requireBoundary, error } = load({
      releaseError: new Error('release unavailable'),
      debugError: failure,
    })
    expect(api.getKeyMap()).toEqual([])
    expect(error.mock.calls[0][0]).toBe(failure)
    expect(api.getCurrentKeyboardLayout()).toBeNull()
    expect(api.onDidChangeKeyboardLayout(() => {})).toBeUndefined()
    expect(api.isISOKeyboard()).toBe(false)
    expect(requireBoundary).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenCalledTimes(3)
  })

  it.each([
    'getKeyMap',
    'getCurrentKeyboardLayout',
    'onDidChangeKeyboardLayout',
    'isISOKeyboard',
  ] as const)(
    '%s contains native exceptions with the documented sentinel',
    (method) => {
      const failure = new Error(`native ${method} failed`)
      const throwing = vi.fn(() => {
        throw failure
      })
      const { api, error } = load({ native: { [method]: throwing } })
      const result =
        method === 'onDidChangeKeyboardLayout'
          ? api[method](() => {})
          : api[method]()
      expect(result).toEqual(
        {
          getKeyMap: [],
          getCurrentKeyboardLayout: null,
          onDidChangeKeyboardLayout: undefined,
          isISOKeyboard: false,
        }[method],
      )
      expect(error.mock.calls).toEqual(
        method === 'isISOKeyboard' ? [] : [[failure]],
      )
      expect(throwing).toHaveBeenCalledTimes(1)
    },
  )

  it.each([false, undefined])(
    'preserves native ISO result %s rather than coercing it',
    (result) => {
      const { api } = load({ native: { isISOKeyboard: () => result } })
      expect(api.isISOKeyboard()).toBe(result)
    },
  )

  it('forwards callback identity, repeated subscriptions and native events; exposes no disposal handle', () => {
    const { api, native, callbacks } = load()
    const first = vi.fn()
    const second = vi.fn()
    expect(api.onDidChangeKeyboardLayout(first)).toBeUndefined()
    expect(api.onDidChangeKeyboardLayout(second)).toBeUndefined()
    expect(callbacks).toEqual([first, second])
    callbacks.forEach((callback) => callback())
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(native.onDidChangeKeyboardLayout.mock.calls).toEqual([
      [first],
      [second],
    ])
    expect('dispose' in api).toBe(false)
  })

  it('does not swallow consumer callback errors emitted after subscription', () => {
    const failure = new Error('consumer callback failed')
    const { api, callbacks, error } = load()
    api.onDidChangeKeyboardLayout(() => {
      throw failure
    })
    expect(() => callbacks[0]()).toThrow(failure)
    expect(error).not.toHaveBeenCalled()
  })
})
