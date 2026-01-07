import { io } from 'socket.io-client'
import koffi from 'koffi'
import keymap from '@packages/native-keymap'

export default () => {
  const user32 = koffi.load('user32.dll')
  function getVKCode(char: string) {
    const res = VkKeyScanW(char.charCodeAt(0))
    return res & 0xff
  }

  const HWND = koffi.pointer('HWND', koffi.opaque())
  const UINT = koffi.types.uint32
  const WPARAM = koffi.types.uintptr
  const LPARAM = koffi.types.intptr
  const PWSTR = koffi.pointer('PWSTR', koffi.types.char16_t)

  const VkKeyScanW = user32.func('int16 __stdcall VkKeyScanW(uint16 ch)')
  const FindWindowW = user32.func(
    'HWND __stdcall FindWindowW(PWSTR lpClassName, PWSTR lpWindowName)',
  )
  const PostMessageW = user32.func(
    'bool __stdcall PostMessageW(HWND hWnd, uint32 Msg, uintptr wParam, intptr lParam)',
  )

  const WM_KEYDOWN = 0x0100
  const WM_KEYUP = 0x0101

  const sendKeydown = (windowTitle: string, keyCode: number) => {
    const hwnd = FindWindowW(null, windowTitle)

    if (!hwnd || hwnd === 0) {
      console.error(`Could not find window: "${windowTitle}"`)
      return
    }

    console.log(`Target window found. Sending key code ${keyCode}...`)

    const lParam = 0x00000001
    PostMessageW(hwnd, WM_KEYDOWN, keyCode, lParam)
  }

  const sendKeyup = (windowTitle: string, keyCode: number) => {
    const hwnd = FindWindowW(null, windowTitle)

    if (!hwnd || hwnd === 0) {
      console.error(`Could not find window: "${windowTitle}"`)
      return
    }

    console.log(`Target window found. Sending key code ${keyCode}...`)

    const lParam = 0xc0000001
    PostMessageW(hwnd, WM_KEYUP, keyCode, lParam)
  }

  const socket = io(`ws://localhost:${import.meta.env.VITE_SERVER_WS_PORT}`, {})
  // Unfortunately this is the only way to do this and it doesn't work
  socket.on('message:start', () => {
    const keyInfo = keymap.getKeyMap()['Space']
    const numericVK = getVKCode(keyInfo.value)
    sendKeydown('VRChat', numericVK)
  })
  socket.on('message:end', () => {
    const keyInfo = keymap.getKeyMap()['Space']
    const numericVK = getVKCode(keyInfo.value)
    sendKeyup('VRChat', numericVK)
  })
}
