var events = require('events')
var koffi = require('koffi')

const WM_INPUT = 0x00ff
const WM_DESTROY = 0x0002
const RID_INPUT = 0x10000003
const RIDEV_INPUTSINK = 0x00000100
const RIM_TYPEMOUSE = 0
const MOUSE_MOVE_ABSOLUTE = 0x0001
const RI_MOUSE_LEFT_BUTTON_DOWN = 0x0001
const RI_MOUSE_LEFT_BUTTON_UP = 0x0002
const RI_MOUSE_RIGHT_BUTTON_DOWN = 0x0004
const RI_MOUSE_RIGHT_BUTTON_UP = 0x0008

const POINT = koffi.struct('POINT', {
  x: 'long',
  y: 'long',
})

const RAWINPUTDEVICE = koffi.struct('RAWINPUTDEVICE', {
  usUsagePage: 'uint16',
  usUsage: 'uint16',
  dwFlags: 'uint32',
  hwndTarget: 'void*',
})

const RAWINPUTHEADER = koffi.struct('RAWINPUTHEADER', {
  dwType: 'uint32',
  dwSize: 'uint32',
  hDevice: 'void*',
  wParam: 'uintptr_t',
})

const RAWMOUSE = koffi.struct('RAWMOUSE', {
  usFlags: 'uint16',
  usButtonFlags: 'uint16',
  usButtonData: 'uint16',
  ulRawButtons: 'uint32',
  lLastX: 'int32',
  lLastY: 'int32',
  ulExtraInformation: 'uint32',
})

const RAWINPUT = koffi.struct('RAWINPUT', {
  header: RAWINPUTHEADER,
  mouse: RAWMOUSE,
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

const WNDPROC = koffi.proto(
  'intptr_t __stdcall WNDPROC(void* hwnd, uint32 uMsg, uintptr_t wParam, intptr_t lParam)',
)
const WNDPROCPtr = koffi.pointer(WNDPROC)

const WNDCLASSEXW = koffi.struct('WNDCLASSEXW', {
  cbSize: 'uint32',
  style: 'uint32',
  lpfnWndProc: WNDPROCPtr,
  cbClsExtra: 'int32',
  cbWndExtra: 'int32',
  hInstance: 'void*',
  hIcon: 'void*',
  hCursor: 'void*',
  hbrBackground: 'void*',
  lpszMenuName: 'void*',
  lpszClassName: 'const wchar_t*',
  hIconSm: 'void*',
})

const RegisterRawInputDevices = user32.func(
  'bool __stdcall RegisterRawInputDevices(RAWINPUTDEVICE *pRawInputDevices, uint32 uiNumDevices, uint32 cbSize)',
)
const GetRawInputData = user32.func(
  'uint32 __stdcall GetRawInputData(void *hRawInput, uint32 uiCommand, void *pData, uint32 *pcbSize, uint32 cbSizeHeader)',
)
const RegisterClassExW = user32.func(
  'uint16 __stdcall RegisterClassExW(WNDCLASSEXW *lpWndClass)',
)
const CreateWindowExW = user32.func(
  'void* __stdcall CreateWindowExW(uint32 dwExStyle, const wchar_t *lpClassName, const wchar_t *lpWindowName, uint32 dwStyle, int32 X, int32 Y, int32 nWidth, int32 nHeight, void *hWndParent, void *hMenu, void *hInstance, void *lpParam)',
)
const DefWindowProcW = user32.func(
  'intptr_t __stdcall DefWindowProcW(void *hWnd, uint32 Msg, uintptr_t wParam, intptr_t lParam)',
)
const DestroyWindow = user32.func('bool __stdcall DestroyWindow(void *hWnd)')
const UnregisterClassW = user32.func(
  'bool __stdcall UnregisterClassW(const wchar_t *lpClassName, void *hInstance)',
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
const GetSystemMetrics = user32.func(
  'int32 __stdcall GetSystemMetrics(int32 nIndex)',
)
const GetLastError = kernel32.func('uint32 __stdcall GetLastError()')
const GetCursorPos = user32.func('bool __stdcall GetCursorPos(POINT *lpPoint)')

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

// Debug and tuning are configurable per-instance via init options; env vars remain as defaults

const SM_CXVIRTUALSCREEN = 78
const SM_CYVIRTUALSCREEN = 79
const SM_CXSCREEN = 0
const SM_CYSCREEN = 1

const init = function (options) {
  const opts = options || {}
  const instDebug = typeof opts.debug === 'boolean' ? opts.debug : false
  const instPumpMs = Math.max(1, Number(opts.pumpMs ?? 6))
  const instMaxMessagesPerTick = Math.max(
    1,
    Number(opts.maxMessagesPerTick ?? 60),
  )

  var that = new events.EventEmitter()
  var hwnd = null
  var left = false
  var right = false
  var windowProc = null
  var pumpTimer = null
  var lastDebugLog = 0
  var lastAbsoluteX = 0
  var lastAbsoluteY = 0
  const className = 'WinMouseRawInputClass_' + Date.now()

  that.once('newListener', function () {
    const hInstance = GetModuleHandleW(null)

    // Create window procedure callback
    windowProc = koffi.register(function (hwnd, msg, wParam, lParam) {
      try {
        if (instDebug) {
          const now = Date.now()
          if (now - lastDebugLog > 1000) {
            lastDebugLog = now
            console.log('[win-mouse] received msg:', '0x' + msg.toString(16))
          }
        }
        if (msg === WM_INPUT) {
          // Get size needed
          const sizeBuf = Buffer.alloc(4)
          sizeBuf.writeUInt32LE(0)
          GetRawInputData(
            lParam,
            RID_INPUT,
            null,
            sizeBuf,
            koffi.sizeof(RAWINPUTHEADER),
          )

          const rawSize = sizeBuf.readUInt32LE(0)
          if (rawSize > 0) {
            const raw = Buffer.alloc(rawSize)
            const sizeForRead = Buffer.alloc(4)
            sizeForRead.writeUInt32LE(rawSize)
            const actualSize = GetRawInputData(
              lParam,
              RID_INPUT,
              raw,
              sizeForRead,
              koffi.sizeof(RAWINPUTHEADER),
            )

            if (actualSize > 0) {
              const rawInput = koffi.decode(raw, RAWINPUT)
              if (rawInput.header.dwType === RIM_TYPEMOUSE) {
                const mouse = rawInput.mouse
                var x, y

                // Get actual cursor position from Windows
                try {
                  const cursorPosBuf = Buffer.alloc(8)
                  if (GetCursorPos(cursorPosBuf)) {
                    x = cursorPosBuf.readInt32LE(0)
                    y = cursorPosBuf.readInt32LE(4)
                  } else {
                    throw new Error('GetCursorPos failed')
                  }
                } catch (e) {
                  // Fallback to tracking relative movement
                  if (mouse.usFlags & MOUSE_MOVE_ABSOLUTE) {
                    const screenWidth =
                      GetSystemMetrics(SM_CXVIRTUALSCREEN) ||
                      GetSystemMetrics(SM_CXSCREEN)
                    const screenHeight =
                      GetSystemMetrics(SM_CYVIRTUALSCREEN) ||
                      GetSystemMetrics(SM_CYSCREEN)

                    const scaleX = screenWidth / 65535.0
                    const scaleY = screenHeight / 65535.0

                    x = Math.round(mouse.lLastX * scaleX)
                    y = Math.round(mouse.lLastY * scaleY)
                  } else {
                    lastAbsoluteX += mouse.lLastX
                    lastAbsoluteY += mouse.lLastY
                    x = lastAbsoluteX
                    y = lastAbsoluteY
                  }
                }

                // Process button events
                var type = null
                const usButtonData = mouse.usButtonData
                if (usButtonData & RI_MOUSE_LEFT_BUTTON_DOWN) {
                  type = 'left-down'
                  left = true
                } else if (usButtonData & RI_MOUSE_LEFT_BUTTON_UP) {
                  type = 'left-up'
                  left = false
                } else if (usButtonData & RI_MOUSE_RIGHT_BUTTON_DOWN) {
                  type = 'right-down'
                  right = true
                } else if (usButtonData & RI_MOUSE_RIGHT_BUTTON_UP) {
                  type = 'right-up'
                  right = false
                } else if (mouse.lLastX !== 0 || mouse.lLastY !== 0) {
                  if (left) {
                    type = 'left-drag'
                  } else if (right) {
                    type = 'right-drag'
                  } else {
                    type = 'move'
                  }
                }

                if (type) {
                  if (instDebug) {
                    const now = Date.now()
                    if (now - lastDebugLog > 250) {
                      lastDebugLog = now
                      console.log('[win-mouse] event', type, x, y)
                    }
                  }
                  that.emit(type, x, y)
                  that.emit('*', type, x, y)
                }
              }
            }
          }

          return 0
        } else if (msg === WM_DESTROY) {
          return 0
        }
      } catch (err) {
        if (instDebug) console.error('[win-mouse] error in windowProc:', err)
      }

      return DefWindowProcW(hwnd, msg, wParam, lParam)
    }, WNDPROCPtr)

    // Register window class
    const wndClass = {
      cbSize: koffi.sizeof(WNDCLASSEXW),
      style: 0,
      lpfnWndProc: windowProc,
      cbClsExtra: 0,
      cbWndExtra: 0,
      hInstance: hInstance,
      hIcon: null,
      hCursor: null,
      hbrBackground: null,
      lpszMenuName: null,
      lpszClassName: className,
      hIconSm: null,
    }

    const regResult = RegisterClassExW(wndClass)
    if (!regResult) {
      const errCode = GetLastError()
      throw new Error('Failed to register window class. Error code: ' + errCode)
    }

    // Create message-only window (use null parent for a simple hidden window)
    hwnd = CreateWindowExW(
      0,
      className,
      'WinMouseRawInput',
      0,
      0,
      0,
      0,
      0,
      null, // parent window
      null,
      hInstance,
      null,
    )

    if (!hwnd) {
      const errCode = GetLastError()
      UnregisterClassW(className, hInstance)
      throw new Error('Failed to create window. Error code: ' + errCode)
    }

    // Register for raw input
    const rid = {
      usUsagePage: 0x01, // HID_USAGE_PAGE_GENERIC
      usUsage: 0x02, // HID_USAGE_GENERIC_MOUSE
      dwFlags: RIDEV_INPUTSINK,
      hwndTarget: hwnd,
    }

    if (!RegisterRawInputDevices(rid, 1, koffi.sizeof(RAWINPUTDEVICE))) {
      const errCode = GetLastError()
      DestroyWindow(hwnd)
      UnregisterClassW(className, hInstance)
      throw new Error(
        'Failed to register raw input devices. Error code: ' + errCode,
      )
    }

    if (instDebug) console.log('[win-mouse] raw input registered')

    // Initialize cursor position for fallback tracking
    try {
      const cursorPosBuf = Buffer.alloc(8)
      if (GetCursorPos(cursorPosBuf)) {
        lastAbsoluteX = cursorPosBuf.readInt32LE(0)
        lastAbsoluteY = cursorPosBuf.readInt32LE(4)
        if (instDebug)
          console.log(
            '[win-mouse] initial cursor pos:',
            lastAbsoluteX,
            lastAbsoluteY,
          )
      }
    } catch (e) {
      // ignore
    }

    // Ensure this thread has a message queue
    try {
      const tmpMsg = allocType(MSG)
      PeekMessageW(tmpMsg, null, 0, 0, PM_NOREMOVE)
    } catch (e) {
      // ignore
    }

    // Start message pump - check ALL windows (null), not just our hwnd
    if (!pumpTimer) {
      const pumpMsg = allocType(MSG)
      pumpTimer = setInterval(function () {
        try {
          var count = 0
          while (
            count < instMaxMessagesPerTick &&
            PeekMessageW(pumpMsg, null, 0, 0, PM_REMOVE)
          ) {
            TranslateMessage(pumpMsg)
            DispatchMessageW(pumpMsg)
            count++
          }
          if (instDebug && count > 0) {
            const now = Date.now()
            if (now - lastDebugLog > 250) {
              lastDebugLog = now
              console.log('[win-mouse] pump drained', count, 'messages')
            }
          }
        } catch (e) {
          // ignore
        }
      }, instPumpMs)
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
    if (hwnd) {
      try {
        DestroyWindow(hwnd)
        const hInstance = GetModuleHandleW(null)
        UnregisterClassW(className, hInstance)
        if (instDebug) console.log('[win-mouse] raw input unregistered')
      } catch (e) {
        // ignore
      }
      hwnd = null
      windowProc = null
    }
  }

  return that
}

function send(...args) {
  process.send([...args])
}

if (process.argv[2]) {
  const event = process.argv[2]
  const mouse = init()
  mouse.on(event, send)
  ;[
    'SIGINT',
    'SIGTERM',
    'SIGQUIT',
    'SIGHUP',
    'SIGBREAK',
    'beforeExit',
    'exit',
  ].forEach((signal) => {
    process?.on(signal, () => {
      mouse.destroy()
    })
  })
}

module.exports = init
