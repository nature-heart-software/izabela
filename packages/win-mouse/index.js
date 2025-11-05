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
const SetWindowsHookExW = user32.func(
  'void* SetWindowsHookExW(int idHook, void *lpfn, void *hmod, uint32 dwThreadId)',
)
const CallNextHookEx = user32.func(
  'intptr_t CallNextHookEx(void *hhk, int nCode, uintptr_t wParam, intptr_t lParam)',
)
const UnhookWindowsHookEx = user32.func('bool UnhookWindowsHookEx(void *hhk)')
const GetMessageW = user32.func(
  'bool GetMessageW(_Out_ void *lpMsg, void *hWnd, uint32 wMsgFilterMin, uint32 wMsgFilterMax)',
)
const PostQuitMessage = user32.func('void PostQuitMessage(int nExitCode)')

module.exports = function () {
  var that = new events.EventEmitter()
  var hookHandle = null
  var left = false
  var right = false
  var hookCallback = null

  that.once('newListener', function () {
    hookCallback = koffi.register(
      function (nCode, wParam, lParam) {
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

        return CallNextHookEx(null, nCode, wParam, lParam)
      },
      'intptr_t',
      ['int', 'uintptr_t', koffi.pointer(MSLLHOOKSTRUCT)],
    )

    hookHandle = SetWindowsHookExW(WH_MOUSE_LL, hookCallback, null, 0)

    if (!hookHandle) {
      throw new Error('Failed to install mouse hook')
    }

    // Start message loop in background
    setImmediate(function pump() {
      const MSG = koffi.struct('MSG', {
        hwnd: 'void*',
        message: 'uint32',
        wParam: 'uintptr_t',
        lParam: 'intptr_t',
        time: 'uint32',
        pt: POINT,
      })
      const msg = {}
      if (hookHandle && GetMessageW(msg, null, 0, 0)) {
        setImmediate(pump)
      }
    })
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
      PostQuitMessage(0)
      hookHandle = null
      hookCallback = null
    }
  }

  return that
}
