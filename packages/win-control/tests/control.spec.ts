import { describe, expect, it, vi } from 'vitest'
import { loadControl } from './load-control'

it('loads only the resolved native addon and re-exports its Window constructor unchanged', () => {
  const Window = vi.fn()
  const { api, requests, nativePath } = loadControl({
    Window,
    privateNativeExport: true,
  })
  expect(requests).toEqual(['path', nativePath])
  expect(api.Window).toBe(Window)
  expect(Window).not.toHaveBeenCalled()
  expect(Object.keys(api).sort()).toEqual([
    'AncestorFlags',
    'HWND',
    'SWP',
    'Window',
    'WindowStates',
  ])
})

it('does not wrap, coerce or prevalidate constructor and positioning arguments', () => {
  const setPosition = vi.fn(() => false)
  const moveRelative = vi.fn(() => true)
  const Window = vi.fn(function (this: any) {
    this.setPosition = setPosition
    this.moveRelative = moveRelative
  })
  const { api } = loadControl({ Window })
  const handle = 0x7fffffff
  const window = new api.Window(handle)
  expect(Window).toHaveBeenCalledExactlyOnceWith(handle)
  expect(
    window.setPosition(
      api.HWND.TOPMOST,
      -10,
      20,
      800,
      600,
      api.SWP.NOMOVE | api.SWP.NOSIZE,
    ),
  ).toBe(false)
  expect(setPosition).toHaveBeenCalledExactlyOnceWith(-1, -10, 20, 800, 600, 3)
  expect(window.moveRelative(-1, 2, -3, 4)).toBe(true)
  expect(moveRelative).toHaveBeenCalledExactlyOnceWith(-1, 2, -3, 4)
})

it('preserves native lookup results, absent windows and boundary errors without translating them', () => {
  const found = { getHwnd: () => 123 }
  const error = new Error('PID must be specified.')
  const Window = Object.assign(vi.fn(), {
    getForeground: vi.fn(() => found),
    getByPid: vi.fn(() => {
      throw error
    }),
    getByTitle: vi.fn(() => undefined),
    getByClassName: vi.fn(() => found),
  })
  const { api } = loadControl({ Window })
  expect(api.Window.getForeground()).toBe(found)
  expect(api.Window.getByTitle('exact title')).toBeUndefined()
  expect(Window.getByTitle).toHaveBeenCalledExactlyOnceWith('exact title')
  expect(api.Window.getByClassName('Editor')).toBe(found)
  expect(Window.getByClassName).toHaveBeenCalledExactlyOnceWith('Editor')
  expect(() => api.Window.getByPid('invalid')).toThrow(error)
  expect(Window.getByPid).toHaveBeenCalledExactlyOnceWith('invalid')
})

it('preserves native bounds and handle objects rather than installing JavaScript geometry logic', () => {
  const bounds = { left: -100, top: -20, right: 700, bottom: 580 }
  const nativeWindow = {
    getDimensions: vi.fn(() => bounds),
    getHwnd: vi.fn(() => -1),
    getParent: vi.fn(() => undefined),
    getAncestor: vi.fn(() => undefined),
  }
  const Window = vi.fn(function () {
    return nativeWindow
  })
  const { api } = loadControl({ Window })
  const window = new api.Window(-1)
  expect(window).toBe(nativeWindow)
  expect(window.getDimensions()).toBe(bounds)
  expect(window.getHwnd()).toBe(-1)
  expect(window.getParent()).toBeUndefined()
  expect(window.getAncestor(api.AncestorFlags.ROOTOWNER)).toBeUndefined()
  expect(nativeWindow.getAncestor).toHaveBeenCalledExactlyOnceWith(3)
})

describe('frozen Windows constants', () => {
  const cases = [
    [
      'WindowStates',
      {
        HIDE: 0,
        SHOWNORMAL: 1,
        SHOWMINIMIZED: 2,
        MAXIMIZE: 3,
        SHOWMAXIMIZED: 3,
        SHOWNOACTIVATE: 4,
        SHOW: 5,
        MINIMIZE: 6,
        SHOWMINNOACTIVE: 7,
        SHOWNA: 8,
        RESTORE: 9,
        SHOWDEFAULT: 10,
        FORCEMINIMIZE: 11,
      },
    ],
    ['AncestorFlags', { PARENT: 1, ROOT: 2, ROOTOWNER: 3 }],
    ['HWND', { NOTOPMOST: -2, TOPMOST: -1, TOP: 0, BOTTOM: 1 }],
    [
      'SWP',
      {
        NOSIZE: 1,
        NOMOVE: 2,
        NOZORDER: 4,
        NOREDRAW: 8,
        NOACTIVATE: 16,
        DRAWFRAME: 32,
        FRAMECHANGED: 32,
        SHOWWINDOW: 64,
        HIDEWINDOW: 128,
        NOCOPYBITS: 256,
        NOOWNERZORDER: 512,
        NOREPOSITION: 512,
        NOSENDCHANGING: 1024,
        DEFERERASE: 8192,
        ASYNCWINDOWPOS: 16384,
      },
    ],
  ] as const
  it.each(cases)(
    '%s exposes exact values and rejects mutation',
    (name, values) => {
      const { api } = loadControl({ Window: vi.fn() })
      expect(api[name]).toEqual(values)
      expect(Object.isFrozen(api[name])).toBe(true)
      expect(() => {
        api[name][Object.keys(values)[0]] = 999
      }).toThrow(TypeError)
    },
  )
})

it('propagates missing/broken native addon errors by identity with no fallback loads', () => {
  const error = Object.assign(new Error('native binary unavailable'), {
    code: 'MODULE_NOT_FOUND',
  })
  expect(() => loadControl({}, error)).toThrow(error)
})

it('uses a fresh CommonJS module for each controlled load', () => {
  const first = loadControl({ Window: vi.fn() }).api
  const second = loadControl({ Window: vi.fn() }).api
  expect(second).not.toBe(first)
  expect(second.Window).not.toBe(first.Window)
  expect(second.SWP).not.toBe(first.SWP)
})
