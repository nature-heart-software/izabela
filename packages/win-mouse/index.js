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
const HookProc = koffi.proto(
  'intptr_t __stdcall HookProc(int nCode, uintptr_t wParam, intptr_t lParam)',
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

module.exports = function () {
  var that = new events.EventEmitter()
  var hookHandle = null
  var left = false
  var right = false
  var hookCallback = null

  that.once('newListener', function () {
    hookCallback = koffi.register(function (nCode, wParam, lParam) {
      try {
        if (nCode >= 0) {
          const hookStruct = koffi.decode(lParam, koffi.pointer(MSLLHOOKSTRUCT))
          const x = hookStruct.pt.x
          const y = hookStruct.pt.y
          var type = null

          if (wParam === WM_LBUTTONDOWN) {
            type = 'left-down'
            left = true
          } else if (wParam === WM_LBUTTONUP) {
            type = 'left-up'
            left = false
          } else if (wParam === WM_RBUTTONDOWN) {
            type = 'right-down'
            right = true
          } else if (wParam === WM_RBUTTONUP) {
            type = 'right-up'
            right = false
          } else if (wParam === WM_MOUSEMOVE) {
            if (left) {
              type = 'left-drag'
            } else if (right) {
              type = 'right-drag'
            } else {
              type = 'move'
            }
          }

          if (type) {
            that.emit(type, x, y)
          }
        }
      } catch (err) {
        // Ignore decoding errors
      }

      return CallNextHookEx(null, nCode, wParam, lParam)
    }, HookProcPtr)

    hookHandle = SetWindowsHookExW(WH_MOUSE_LL, hookCallback, null, 0)

    if (!hookHandle) {
      throw new Error('Failed to install mouse hook')
    }
  })

  that.ref = function () {
    // No-op for koffi implementation
  }

  that.unref = function () {
    // No-op for koffi implementation
  }

  that.destroy = function () {
    if (hookHandle) {
      UnhookWindowsHookEx(hookHandle)
      hookHandle = null
      hookCallback = null
    }
  }

  return that
}
