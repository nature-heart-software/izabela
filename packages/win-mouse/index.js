var events = require('events')
var koffi = require('koffi')

const WH_MOUSE_LL = 14
const WM_LBUTTONDOWN = 0x0201
const WM_LBUTTONUP = 0x0202
const WM_RBUTTONDOWN = 0x0204
const WM_RBUTTONUP = 0x0205
const WM_MOUSEMOVE = 0x0200

const POINT = koffi.struct('POINT', {
  x: 'long',
  y: 'long',
})

const MSLLHOOKSTRUCT = koffi.struct('MSLLHOOKSTRUCT', {
  pt: POINT,
  mouseData: 'uint32',
  flags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr_t',
})

const user32 = koffi.load('user32.dll')
const kernel32 = koffi.load('kernel32.dll')

// Windows message loop support
const PM_NOREMOVE = 0x0000
const PM_REMOVE = 0x0001

const MSG = koffi.struct('MSG', {
  hwnd: 'void*',
  message: 'uint32',
  wParam: 'uintptr_t',
  lParam: 'intptr_t',
  time: 'uint32',
  pt: POINT,
  lPrivate: 'uint32',
})

const HookProc = koffi.proto(
  'intptr_t __stdcall HookProc(int nCode, uintptr_t wParam, void* lParam)',
)
const HookProcPtr = koffi.pointer(HookProc)
const SetWindowsHookExW = user32.func(
  'void* __stdcall SetWindowsHookExW(int idHook, HookProc *lpfn, void *hmod, uint32 dwThreadId)',
)
const CallNextHookEx = user32.func(
  'intptr_t __stdcall CallNextHookEx(void *hhk, int nCode, uintptr_t wParam, intptr_t lParam)',
)
const UnhookWindowsHookEx = user32.func(
  'bool __stdcall UnhookWindowsHookEx(void *hhk)',
)
const PeekMessageW = user32.func(
  'bool __stdcall PeekMessageW(MSG *lpMsg, void *hWnd, uint32 wMsgFilterMin, uint32 wMsgFilterMax, uint32 wRemoveMsg)',
)
const TranslateMessage = user32.func(
  'bool __stdcall TranslateMessage(MSG *lpMsg)',
)
const DispatchMessageW = user32.func(
  'intptr_t __stdcall DispatchMessageW(MSG *lpMsg)',
)
const GetModuleHandleW = kernel32.func(
  'void* __stdcall GetModuleHandleW(const wchar_t *lpModuleName)',
)

// Helper: robust allocator across Koffi versions (alloc may require 2 args)
function allocType(type) {
  try {
    // Koffi >= 2.9 may require a count argument
    return koffi.alloc(type, 1)
  } catch (e1) {
    try {
      // Older versions accepted single argument
      return koffi.alloc(type)
    } catch (e2) {
      // Last resort: allocate raw buffer and cast
      if (
        typeof koffi.sizeof === 'function' &&
        typeof koffi.as === 'function'
      ) {
        const buf = Buffer.alloc(koffi.sizeof(type))
        return koffi.as(type, buf)
      }
      throw e2
    }
  }
}

// Debug and tuning
const DEBUG = process.env.WIN_MOUSE_DEBUG === '1'
const PUMP_MS = Math.max(1, Number(process.env.WIN_MOUSE_PUMP_MS) || 16)
const MAX_MESSAGES_PER_TICK = Math.max(
  1,
  Number(process.env.WIN_MOUSE_MAX_PER_TICK) || 100,
)

module.exports = function () {
  var that = new events.EventEmitter()
  var hookHandle = null
  var left = false
  var right = false
  var hookCallback = null
  var pumpTimer = null
  var lastDebugLog = 0

  that.once('newListener', function () {
    hookCallback = koffi.register(function (nCode, wParam, lParam) {
      try {
        if (nCode >= 0) {
          const hookStruct = koffi.decode(lParam, MSLLHOOKSTRUCT)
          const x = hookStruct.pt.x
          const y = hookStruct.pt.y
          var type = null

          const wp = Number(wParam)
          if (wp === WM_LBUTTONDOWN) {
            type = 'left-down'
            left = true
          } else if (wp === WM_LBUTTONUP) {
            type = 'left-up'
            left = false
          } else if (wp === WM_RBUTTONDOWN) {
            type = 'right-down'
            right = true
          } else if (wp === WM_RBUTTONUP) {
            type = 'right-up'
            right = false
          } else if (wp === WM_MOUSEMOVE) {
            if (left) {
              type = 'left-drag'
            } else if (right) {
              type = 'right-drag'
            } else {
              type = 'move'
            }
          }

          if (type) {
            if (DEBUG) {
              const now = Date.now()
              if (now - lastDebugLog > 250) {
                lastDebugLog = now
                // Avoid spamming; log occasional type for diagnostics
                console.log('[win-mouse] event', type, x, y)
              }
            }
            that.emit(type, x, y)
          }
        }
      } catch (err) {
        // Ignore decoding errors
      }

      return CallNextHookEx(null, nCode, wParam, lParam)
    }, HookProcPtr)

    const hMod = GetModuleHandleW(null)
    hookHandle = SetWindowsHookExW(WH_MOUSE_LL, hookCallback, hMod, 0)

    if (!hookHandle) {
      throw new Error('Failed to install mouse hook')
    }

    if (DEBUG) console.log('[win-mouse] hook installed')

    // Ensure this thread has a message queue
    try {
      const tmpMsg = allocType(MSG)
      PeekMessageW(tmpMsg, null, 0, 0, PM_NOREMOVE)
    } catch (e) {
      // ignore
    }

    // Start a tiny message pump to dispatch messages so the low-level hook fires
    if (!pumpTimer) {
      const pumpMsg = allocType(MSG)
      pumpTimer = setInterval(function () {
        try {
          var count = 0
          while (
            count < MAX_MESSAGES_PER_TICK &&
            PeekMessageW(pumpMsg, null, 0, 0, PM_REMOVE)
          ) {
            TranslateMessage(pumpMsg)
            DispatchMessageW(pumpMsg)
            count++
          }
          if (DEBUG && count > 0) {
            const now = Date.now()
            if (now - lastDebugLog > 250) {
              lastDebugLog = now
              console.log('[win-mouse] pump drained', count, 'messages')
            }
          }
        } catch (e) {
          // ignore
        }
      }, PUMP_MS)
    }
  })

  that.ref = function () {
    // No-op for koffi implementation
  }

  that.unref = function () {
    // No-op for koffi implementation
  }

  that.destroy = function () {
    if (pumpTimer) {
      clearInterval(pumpTimer)
      pumpTimer = null
    }
    if (hookHandle) {
      UnhookWindowsHookEx(hookHandle)
      if (DEBUG) console.log('[win-mouse] hook uninstalled')
      hookHandle = null
      hookCallback = null
    }
  }

  return that
}
