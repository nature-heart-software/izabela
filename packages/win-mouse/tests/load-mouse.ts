import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInThisContext } from 'node:vm'
import { vi } from 'vitest'

const entry = fileURLToPath(new URL('../index.js', import.meta.url))
export function loadMouse(argv: string[] = ['node', entry]) {
  const native: Record<string, ReturnType<typeof vi.fn>> = {}
  const signatures: Record<string, string> = {}
  const callbacks: Function[] = []
  const queue: Record<string, unknown>[] = []
  const state = {
    cursor: [100, -20] as [number, number] | null,
    packet: {
      header: { dwType: 0 },
      mouse: {
        usFlags: 0,
        usButtonFlags: 0,
        usButtonData: 0,
        lLastX: 0,
        lLastY: 0,
      },
    },
    size: 48,
    actualSize: 48,
    handle: { native: 'window' },
    instance: { native: 'module' },
  }
  const functions: Record<string, (...args: any[]) => any> = {
    GetModuleHandleW: () => state.instance,
    RegisterClassExW: () => 1,
    CreateWindowExW: () => state.handle,
    RegisterRawInputDevices: () => true,
    DestroyWindow: () => true,
    UnregisterClassW: () => true,
    GetLastError: () => 5,
    DefWindowProcW: () => 99,
    GetSystemMetrics: (index: number) =>
      ({ 78: 1920, 79: 1080, 0: 1280, 1: 720 })[index],
    GetCursorPos: (buffer: Buffer) => {
      if (!state.cursor) return false
      buffer.writeInt32LE(state.cursor[0], 0)
      buffer.writeInt32LE(state.cursor[1], 4)
      return true
    },
    GetRawInputData: (
      _handle: unknown,
      _command: number,
      data: Buffer | null,
      size: Buffer,
    ) => {
      size.writeUInt32LE(state.size)
      return data ? state.actualSize : 0
    },
    PeekMessageW: (
      message: Record<string, unknown>,
      _hwnd: unknown,
      _min: number,
      _max: number,
      flag: number,
    ) => {
      if (!flag || !queue.length) return false
      Object.assign(message, queue.shift())
      return true
    },
    TranslateMessage: () => true,
    DispatchMessageW: () => 0,
  }
  const koffi = {
    struct: vi.fn((name: string, fields: unknown) => ({ name, fields })),
    proto: vi.fn((signature: string) => ({ signature })),
    pointer: vi.fn((type: unknown) => ({ pointer: type })),
    load: vi.fn((dll: string) => ({
      func: (signature: string) => {
        const name = signature.match(/__stdcall (\w+)\(/)![1]
        if (!(name in functions))
          throw new Error(`Unexpected native function: ${name}`)
        signatures[name] = signature
        return (native[name] = vi.fn(functions[name]))
      },
    })),
    sizeof: vi.fn(
      (type: { name: string }) =>
        ({ RAWINPUTHEADER: 24, RAWINPUTDEVICE: 16, WNDCLASSEXW: 80, MSG: 48 })[
          type.name
        ] ?? 8,
    ),
    alloc: vi.fn((_type: unknown, _count?: number) => ({})),
    as: vi.fn((_type: unknown, buffer: Buffer) => buffer),
    register: vi.fn((callback: Function, _type: unknown) => {
      callbacks.push(callback)
      return callback
    }),
    unregister: vi.fn(),
    decode: vi.fn(() => state.packet),
  }
  const processBoundary = Object.assign(new EventEmitter(), {
    argv,
    send: vi.fn(),
  })
  const module = { exports: undefined as any }
  const require = (id: string) => {
    if (id === 'events') return { EventEmitter }
    if (id === 'koffi') return koffi
    throw new Error(`Unexpected module boundary: ${id}`)
  }
  const evaluate = runInThisContext(
    `(function(require,module,exports,process){${readFileSync(entry, 'utf8')}\n})`,
    { filename: entry },
  )
  evaluate(require, module, module.exports, processBoundary)
  const input = (
    mouse: Partial<typeof state.packet.mouse> = {},
    headerType = 0,
  ) => {
    state.packet = {
      header: { dwType: headerType },
      mouse: {
        usFlags: 0,
        usButtonFlags: 0,
        usButtonData: 0,
        lLastX: 0,
        lLastY: 0,
        ...mouse,
      },
    }
    return callbacks[0](state.handle, 0xff, 0, 123)
  }
  return {
    init: module.exports,
    native,
    koffi,
    callbacks,
    state,
    queue,
    input,
    process: processBoundary,
    signatures,
  }
}
