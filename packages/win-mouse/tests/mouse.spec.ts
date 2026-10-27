import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadMouse } from './load-mouse'

const mice: { destroy(): void }[] = []
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2020-01-01T00:00:00Z'))
})
afterEach(() => {
  mice.splice(0).forEach((mouse) => mouse.destroy())
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})
function started(options?: unknown) {
  const harness = loadMouse()
  const mouse = harness.init(options)
  mice.push(mouse)
  const wildcard = vi.fn()
  mouse.on('*', wildcard)
  return { ...harness, mouse, wildcard }
}

it('exports an initializer, uses real EventEmitter and lazily initializes native boundaries once', () => {
  const h = loadMouse()
  expect(typeof h.init).toBe('function')
  expect(h.koffi.load.mock.calls).toEqual([['user32.dll'], ['kernel32.dll']])
  const mouse = h.init()
  mice.push(mouse)
  expect(mouse).toBeInstanceOf(EventEmitter)
  expect(h.native.RegisterClassExW).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
  mouse.on('move', vi.fn())
  mouse.on('left-down', vi.fn())
  expect(h.native.RegisterClassExW).toHaveBeenCalledOnce()
  expect(h.native.RegisterRawInputDevices).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(1)
  expect(mouse.click).toBeUndefined()
  expect(mouse.move).toBeUndefined()
  expect(mouse.wheel).toBeUndefined()
})

it('registers exact raw-input, hidden-window and callback arguments', () => {
  const h = started()
  const wnd = h.native.RegisterClassExW.mock.calls[0][0]
  expect(wnd).toMatchObject({
    cbSize: 80,
    style: 0,
    lpfnWndProc: h.callbacks[0],
    hInstance: h.state.instance,
    lpszClassName: 'WinMouseRawInputClass_1577836800000',
  })
  expect(h.native.CreateWindowExW).toHaveBeenCalledExactlyOnceWith(
    0,
    wnd.lpszClassName,
    'WinMouseRawInput',
    0,
    0,
    0,
    0,
    0,
    null,
    null,
    h.state.instance,
    null,
  )
  expect(h.native.RegisterRawInputDevices).toHaveBeenCalledExactlyOnceWith(
    { usUsagePage: 1, usUsage: 2, dwFlags: 256, hwndTarget: h.state.handle },
    1,
    16,
  )
  expect(h.native.PeekMessageW).toHaveBeenCalledExactlyOnceWith(
    expect.any(Object),
    null,
    0,
    0,
    0,
  )
  expect(h.koffi.proto).toHaveBeenCalledWith(
    'intptr_t __stdcall WNDPROC(void* hwnd, uint32 uMsg, uintptr_t wParam, intptr_t lParam)',
  )
})

it('emits movement and wildcard coordinates from cursor buffers, not raw deltas', () => {
  const h = started()
  const move = vi.fn()
  h.mouse.on('move', move)
  h.state.cursor = [-200, 300]
  expect(h.input({ lLastX: 4, lLastY: -7 })).toBe(0)
  expect(move).toHaveBeenCalledExactlyOnceWith(-200, 300)
  expect(h.wildcard).toHaveBeenCalledExactlyOnceWith('move', -200, 300)
  expect(h.native.GetRawInputData.mock.calls[0]).toEqual([
    123,
    0x10000003,
    null,
    expect.any(Buffer),
    24,
  ])
  const read = h.native.GetRawInputData.mock.calls[1]
  expect(read[2]).toBeInstanceOf(Buffer)
  expect(read[2].length).toBe(48)
  expect(read[3].readUInt32LE()).toBe(48)
  expect(h.koffi.decode).toHaveBeenCalledOnce()
})

it.each([
  ['left-down', 1, 'left-drag', 'left-up', 2],
  ['right-down', 4, 'right-drag', 'right-up', 8],
  ['middle-down', 16, 'middle-drag', 'middle-up', 32],
] as const)(
  'characterizes %s, held drag and release from usButtonData',
  (down, downBit, drag, up, upBit) => {
    const h = started()
    h.input({ usButtonData: downBit })
    h.input({ lLastX: 1 })
    h.input({ usButtonData: upBit })
    h.input({ lLastY: 1 })
    expect(h.wildcard.mock.calls.map(([name]) => name)).toEqual([
      down,
      drag,
      up,
      'move',
    ])
  },
)

it('prioritizes simultaneous button data and middle dragging exactly as implemented', () => {
  const h = started()
  h.input({ usButtonData: 1 | 4 })
  h.input({ lLastX: 1 })
  h.input({ usButtonData: 16 })
  h.input()
  expect(h.wildcard.mock.calls.map(([name]) => name)).toEqual([
    'left-down',
    'left-drag',
    'middle-down',
    'middle-drag',
  ])
})

it('characterizes actual button flags ignored when the data word is zero', () => {
  const h = started()
  expect(h.input({ usButtonFlags: 1, usButtonData: 0 })).toBe(0)
  expect(h.koffi.decode).toHaveBeenCalledOnce()
  expect(h.wildcard).not.toHaveBeenCalled()
})
it.fails(
  '[known issue] button transitions should use usButtonFlags rather than usButtonData',
  () => {
    const h = started()
    h.input({ usButtonFlags: 1, usButtonData: 0 })
    expect(h.wildcard).toHaveBeenCalledExactlyOnceWith('left-down', 100, -20)
  },
)

it('characterizes wheel input as right-up due to its data bits, with no click/wheel API', () => {
  const h = started()
  const wheel = vi.fn()
  const click = vi.fn()
  h.mouse.on('wheel', wheel)
  h.mouse.on('click', click)
  h.input({ usButtonFlags: 0x400, usButtonData: 120 })
  expect(h.wildcard).toHaveBeenCalledExactlyOnceWith('right-up', 100, -20)
  expect(wheel).not.toHaveBeenCalled()
  expect(click).not.toHaveBeenCalled()
})

it('accumulates fallback deltas from the initial cursor when cursor lookup fails', () => {
  const h = started()
  h.state.cursor = null
  h.input({ lLastX: 5, lLastY: -3 })
  h.input({ lLastX: -2, lLastY: 10 })
  expect(h.wildcard.mock.calls).toEqual([
    ['move', 105, -23],
    ['move', 103, -13],
  ])
})

it('scales absolute input against virtual-screen metrics and falls back to primary metrics', () => {
  const h = started()
  h.state.cursor = null
  h.input({ usFlags: 1, lLastX: 65535, lLastY: 32768 })
  expect(h.wildcard).toHaveBeenLastCalledWith('move', 1920, 540)
  h.native.GetSystemMetrics.mockImplementation(
    (index) => ({ 78: 0, 79: 0, 0: 1280, 1: 720 })[index],
  )
  h.input({ usFlags: 1, lLastX: 65535, lLastY: 65535 })
  expect(h.wildcard).toHaveBeenLastCalledWith('move', 1280, 720)
  expect(h.native.GetSystemMetrics.mock.calls.map(([index]) => index)).toEqual([
    78, 79, 78, 0, 79, 1,
  ])
})

it('ignores non-mouse, empty and unreadable packets and delegates unrelated messages', () => {
  const h = started()
  expect(h.callbacks[0](h.state.handle, 2, 0, 0)).toBe(0)
  expect(h.callbacks[0](h.state.handle, 99, 1, 2)).toBe(99)
  expect(h.native.DefWindowProcW).toHaveBeenCalledExactlyOnceWith(
    h.state.handle,
    99,
    1,
    2,
  )
  h.input({ lLastX: 1 }, 1)
  h.state.size = 0
  h.input({ lLastX: 1 })
  h.state.size = 48
  h.state.actualSize = 0
  h.input({ lLastX: 1 })
  expect(h.wildcard).not.toHaveBeenCalled()
})

it('contains native decoding and listener exceptions inside the window callback', () => {
  const h = started()
  h.koffi.decode.mockImplementationOnce(() => {
    throw new Error('bad packet')
  })
  expect(h.input({ lLastX: 1 })).toBe(99)
  h.mouse.on('move', () => {
    throw new Error('consumer error')
  })
  expect(h.input({ lLastX: 1 })).toBe(99)
  expect(h.native.DefWindowProcW).toHaveBeenCalledTimes(2)
})

it('pumps all-window messages on the configured cadence with a bounded tick budget', () => {
  const h = started({ pumpMs: 10, maxMessagesPerTick: 2 })
  h.queue.push({ message: 1 }, { message: 2 }, { message: 3 })
  vi.advanceTimersByTime(9)
  expect(h.native.DispatchMessageW).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(h.native.TranslateMessage).toHaveBeenCalledTimes(2)
  expect(h.native.DispatchMessageW).toHaveBeenCalledTimes(2)
  expect(h.queue).toHaveLength(1)
  expect(
    h.native.PeekMessageW.mock.calls
      .slice(1)
      .every((args) => args[1] === null && args[4] === 1),
  ).toBe(true)
  vi.advanceTimersByTime(10)
  expect(h.native.DispatchMessageW).toHaveBeenCalledTimes(3)
})

it('uses the default six millisecond cadence and clamps zero/negative numeric options', () => {
  const first = started()
  first.queue.push({ message: 1 })
  vi.advanceTimersByTime(5)
  expect(first.native.DispatchMessageW).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(first.native.DispatchMessageW).toHaveBeenCalledOnce()
  first.mouse.destroy()
  const second = started({ pumpMs: 0, maxMessagesPerTick: -1 })
  second.queue.push({}, {})
  vi.advanceTimersByTime(1)
  expect(second.native.DispatchMessageW).toHaveBeenCalledOnce()
  expect(second.queue).toHaveLength(1)
})

it('contains pump exceptions and permits the next tick to continue', () => {
  const h = started()
  h.native.PeekMessageW.mockImplementationOnce(() => {
    throw new Error('pump failed')
  })
  expect(() => vi.advanceTimersByTime(6)).not.toThrow()
  h.queue.push({})
  vi.advanceTimersByTime(6)
  expect(h.native.DispatchMessageW).toHaveBeenCalledOnce()
})

it('characterizes ref/unref as no-ops and destroy as idempotent timer/window cleanup', () => {
  const h = started()
  expect(h.mouse.unref()).toBeUndefined()
  expect(h.mouse.ref()).toBeUndefined()
  expect(vi.getTimerCount()).toBe(1)
  h.mouse.destroy()
  h.mouse.destroy()
  expect(vi.getTimerCount()).toBe(0)
  expect(h.native.DestroyWindow).toHaveBeenCalledExactlyOnceWith(h.state.handle)
  expect(h.native.UnregisterClassW).toHaveBeenCalledExactlyOnceWith(
    'WinMouseRawInputClass_1577836800000',
    h.state.instance,
  )
  expect(h.koffi.unregister).not.toHaveBeenCalled()
})

it('keeps independent instances and their destruction isolated', () => {
  const h = loadMouse()
  const a = h.init()
  const b = h.init()
  mice.push(a, b)
  const onA = vi.fn()
  const onB = vi.fn()
  a.on('move', onA)
  vi.advanceTimersByTime(1)
  b.on('move', onB)
  h.state.packet.mouse.lLastX = 1
  h.callbacks[0](h.state.handle, 0xff, 0, 123)
  expect(onA).toHaveBeenCalledOnce()
  expect(onB).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(2)
  a.destroy()
  expect(vi.getTimerCount()).toBe(1)
  h.callbacks[1](h.state.handle, 0xff, 0, 123)
  expect(onB).toHaveBeenCalledOnce()
})

it.each([
  ['RegisterClassExW', 'Failed to register window class. Error code: 5', 0, 0],
  ['CreateWindowExW', 'Failed to create window. Error code: 5', 0, 1],
  [
    'RegisterRawInputDevices',
    'Failed to register raw input devices. Error code: 5',
    1,
    1,
  ],
] as const)(
  'propagates %s startup failure with the implemented rollback',
  (name, message, destroyed, unregistered) => {
    const h = loadMouse()
    h.native[name].mockReturnValueOnce(0)
    const mouse = h.init()
    expect(() => mouse.on('move', vi.fn())).toThrow(message)
    expect(h.native.DestroyWindow).toHaveBeenCalledTimes(destroyed)
    expect(h.native.UnregisterClassW).toHaveBeenCalledTimes(unregistered)
    expect(vi.getTimerCount()).toBe(0)
    expect(h.koffi.register).toHaveBeenCalledOnce()
    expect(h.koffi.unregister).not.toHaveBeenCalled()
  },
)

it('supports allocator count, old single-argument and raw Buffer fallback boundaries', () => {
  const h = loadMouse()
  h.koffi.alloc.mockImplementation((_type, count) => {
    if (count === 1) throw new Error('old allocator')
    return {}
  })
  const a = h.init()
  mice.push(a)
  a.on('move', vi.fn())
  expect(h.koffi.alloc.mock.calls.map((args) => args.length)).toEqual([
    2, 1, 2, 1,
  ])
  a.destroy()
  h.koffi.alloc.mockImplementation(() => {
    throw new Error('no allocator')
  })
  const b = h.init()
  mice.push(b)
  b.on('move', vi.fn())
  expect(h.koffi.as).toHaveBeenCalledTimes(2)
  expect(
    h.koffi.as.mock.calls.every(
      (args) => Buffer.isBuffer(args[1]) && args[1].length === 48,
    ),
  ).toBe(true)
})

it('contains destroy boundary failures and always clears its pump timer', () => {
  const h = started()
  h.native.DestroyWindow.mockImplementationOnce(() => {
    throw new Error('destroy failed')
  })
  expect(() => h.mouse.destroy()).not.toThrow()
  expect(vi.getTimerCount()).toBe(0)
  expect(h.native.UnregisterClassW).not.toHaveBeenCalled()
  h.mouse.destroy()
  expect(h.native.DestroyWindow).toHaveBeenCalledOnce()
})

it('forwards child-mode events and signal cleanup only to an isolated process boundary', () => {
  const h = loadMouse(['node', 'win-mouse', 'move'])
  expect(h.process.eventNames().sort()).toEqual(
    [
      'SIGBREAK',
      'SIGHUP',
      'SIGINT',
      'SIGQUIT',
      'SIGTERM',
      'beforeExit',
      'exit',
    ].sort(),
  )
  h.input({ lLastX: 1 })
  expect(h.process.send).toHaveBeenCalledExactlyOnceWith([100, -20])
  h.process.emit('SIGTERM')
  expect(h.native.DestroyWindow).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

it('logs opt-in debug messages and swallows callback errors after logging', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const h = started({ debug: true })
  expect(log).toHaveBeenCalledWith('[win-mouse] raw input registered')
  h.koffi.decode.mockImplementationOnce(() => {
    throw new Error('decode failed')
  })
  h.input({ lLastX: 1 })
  expect(error).toHaveBeenCalledWith(
    '[win-mouse] error in windowProc:',
    expect.objectContaining({ message: 'decode failed' }),
  )
})
