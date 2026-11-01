// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import {
  blobToBase64,
  Deferred,
  log,
  purify,
  structuredClone,
  serialize,
  deserialize,
  stringify,
  parse,
} from '../src/main'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('data conversion', () => {
  it('reads actual binary Blob bytes as a data URL', async () => {
    await expect(
      blobToBase64(
        new Blob([new Uint8Array([0, 1, 127, 128, 255])], {
          type: 'application/octet-stream',
        }),
      ),
    ).resolves.toBe('data:application/octet-stream;base64,AAF/gP8=')
  })
  it('reads Unicode and empty blobs without corrupting their encoding', async () => {
    await expect(
      blobToBase64(new Blob(['hé🌍'], { type: 'text/plain' })),
    ).resolves.toBe('data:text/plain;base64,aMOp8J+MjQ==')
    await expect(blobToBase64(new Blob([]))).resolves.toBe(
      'data:application/octet-stream;base64,',
    )
  })
  it('keeps concurrent readers independent', async () => {
    await expect(
      Promise.all(['a', 'b'].map((text) => blobToBase64(new Blob([text])))),
    ).resolves.toEqual([
      'data:application/octet-stream;base64,YQ==',
      'data:application/octet-stream;base64,Yg==',
    ])
  })
  it('propagates a synchronous readAsDataURL error before returning a promise', () => {
    const error = new Error('invalid reader state')
    vi.stubGlobal(
      'FileReader',
      class {
        readAsDataURL() {
          throw error
        }
      },
    )
    expect(() => blobToBase64(new Blob())).toThrow(error)
  })
  function failingReader() {
    let reader!: {
      result: null
      onloadend?: () => void
      readAsDataURL: () => void
    }
    vi.stubGlobal(
      'FileReader',
      class {
        result = null
        onloadend?: () => void
        constructor() {
          reader = this
        }
        readAsDataURL() {}
      },
    )
    const promise = blobToBase64(new Blob())
    return { promise, finish: () => reader.onloadend?.() }
  }
  it('currently resolves null on failed asynchronous reads when loadend fires', async () => {
    const read = failingReader()
    read.finish()
    await expect(read.promise).resolves.toBeNull()
  })
  it.fails(
    '[known issue] rejects failed asynchronous reads instead of fulfilling a string promise with null',
    async () => {
      const read = failingReader()
      read.finish()
      await expect(read.promise).rejects.toThrow()
    },
  )
})

describe('Deferred', () => {
  it('remains pending until explicitly resolved and notifies in a microtask', async () => {
    const deferred = Deferred<number>()
    const then = vi.fn()
    const observed = deferred.promise.then(then)
    await Promise.resolve()
    expect(then).not.toHaveBeenCalled()
    expect(deferred.resolve(42)).toBeUndefined()
    expect(then).not.toHaveBeenCalled()
    await observed
    expect(then).toHaveBeenCalledExactlyOnceWith(42)
  })
  it('uses the first settlement even after further resolve/reject calls', async () => {
    const d = Deferred<string>()
    d.resolve('first')
    d.reject(new Error('late'))
    d.resolve('last')
    await expect(d.promise).resolves.toBe('first')
  })
  it('preserves rejection identity and runs finally exactly once', async () => {
    const d = Deferred<never>()
    const error = new Error('cancelled')
    const cleanup = vi.fn()
    const observed = d.promise.finally(cleanup)
    const rejected = expect(observed).rejects.toBe(error)
    d.reject(error)
    d.reject('ignored')
    await rejected
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
  it('supports an undefined rejection reason', async () => {
    const d = Deferred<void>()
    const observed = expect(d.promise).rejects.toBeUndefined()
    d.reject()
    await observed
  })
  it('assimilates a promise value instead of settling before it', async () => {
    const outer = Deferred<Promise<number>>()
    const inner = Deferred<number>()
    const then = vi.fn()
    const observed = outer.promise.then(then)
    outer.resolve(inner.promise)
    await Promise.resolve()
    expect(then).not.toHaveBeenCalled()
    inner.resolve(8)
    await observed
    expect(then).toHaveBeenCalledExactlyOnceWith(8)
  })
  it('keeps distinct deferreds independent', async () => {
    const a = Deferred<number>(),
      b = Deferred<number>()
    b.resolve(2)
    a.resolve(1)
    await expect(Promise.all([a.promise, b.promise])).resolves.toEqual([1, 2])
  })
})

describe('log', () => {
  it('forwards every argument by identity and returns the first', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    const value = { nested: true }
    expect(log(value, 0, undefined, 'tail')).toBe(value)
    expect(consoleLog).toHaveBeenCalledExactlyOnceWith(
      value,
      0,
      undefined,
      'tail',
    )
  })
  it.each([false, 0, '', null, undefined])(
    'preserves a falsy first argument %s',
    (value) => {
      vi.spyOn(console, 'log').mockImplementation(() => {})
      expect(log(value)).toBe(value)
    },
  )
  it('supports no arguments and propagates console errors', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(log()).toBeUndefined()
    expect(consoleLog).toHaveBeenCalledExactlyOnceWith()
    const error = new Error('console unavailable')
    consoleLog.mockImplementation(() => {
      throw error
    })
    expect(() => log('x')).toThrow(error)
  })
})

describe('object transformations', () => {
  it.each([null, undefined, false, 0, '', 'text', 12n])(
    'purify preserves primitive %s',
    (value) => {
      expect(purify(value)).toBe(value)
    },
  )
  it('purify leaves functions unchanged at the root', () => {
    const fn = () => 1
    expect(purify(fn)).toBe(fn)
  })
  it('purify detaches nested reactive objects and retains cycles and shared references', () => {
    const shared = { value: 1 }
    const input: { a: typeof shared; b: typeof shared; self?: unknown } = {
      a: shared,
      b: shared,
    }
    input.self = input
    const copy = purify(reactive(input))
    expect(copy).not.toBe(input)
    expect(copy.a).not.toBe(shared)
    expect(copy.a).toBe(copy.b)
    expect(copy.self).toBe(copy)
    copy.a.value = 9
    expect(shared.value).toBe(1)
  })
  it('purify removes nested functions/symbols and applies toJSON', () => {
    const symbol = Symbol('x')
    expect(
      purify({
        a: 1,
        fn: () => 1,
        symbol,
        values: [() => 1, symbol, undefined],
      }),
    ).toEqual({ a: 1, values: [null, null, undefined] })
    expect(purify({ toJSON: () => ({ encoded: true }) })).toEqual({
      encoded: true,
    })
  })
  it('purify converts class instances to plain data and propagates getters/toJSON errors', () => {
    class Value {
      constructor(public value: number) {}
    }
    const copy = purify(new Value(2))
    expect(copy).toEqual({ value: 2 })
    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype)
    const error = new Error('getter failed')
    expect(() =>
      purify({
        get value() {
          throw error
        },
      }),
    ).toThrow(error)
    expect(() =>
      purify({
        toJSON() {
          throw error
        },
      }),
    ).toThrow(error)
  })
  it('round trips rich data through real serialize/deserialize and stringify/parse', () => {
    const input = {
      date: new Date('2020-01-02T03:04:05Z'),
      regexp: /a+/gi,
      map: new Map([['x', { value: 1 }]]),
      set: new Set([1, 2]),
      bytes: new Uint8Array([0, 255]),
      big: 123n,
      undef: undefined,
    }
    const records = serialize(input)
    expect(Array.isArray(records)).toBe(true)
    const restored = deserialize(records)
    expect(restored).toEqual(input)
    expect(restored).not.toBe(input)
    expect(parse(stringify(input))).toEqual(input)
    expect(purify(input)).toEqual(input)
  })
  it('round trips cyclic data through textual serialization', () => {
    const input: { self?: unknown } = {}
    input.self = input
    const copy = parse<{ self: unknown }>(stringify(input))
    expect(copy.self).toBe(copy)
  })
  it('strict serialize rejects functions and malformed parse/deserialize inputs throw', () => {
    expect(() => serialize({ fn: () => 1 })).toThrow(TypeError)
    expect(() => parse('not json')).toThrow(SyntaxError)
    expect(() => deserialize([])).toThrow(TypeError)
  })
  it('structuredClone produces independent rich values and rejects functions', () => {
    const input = {
      map: new Map([['a', [1, 2]]]),
      date: new Date('2021-01-01'),
      nested: [true],
    }
    const copy = structuredClone(input)
    expect(copy).toEqual(input)
    expect(copy.map).not.toBe(input.map)
    copy.nested.push(false)
    expect(input.nested).toEqual([true])
    expect(() => structuredClone(() => 1)).toThrow()
  })
})
